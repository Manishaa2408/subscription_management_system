const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');

const BillingSchedule = require('../models/BillingSchedule');
const BillingRun = require('../models/BillingRun');
const BillingExecution = require('../models/BillingExecution');
const BillingAttempt = require('../models/BillingAttempt');
const BillingLog = require('../models/BillingLog');
const BillingSequence = require('../models/BillingSequence');

const { generateDevToken } = require('../adapters/authAdapter');
const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const invoiceAdapter = require('../adapters/invoiceAdapter');

const {
  isLeapYear,
  getDaysInMonth,
  calculateNextBillingDate,
  calculateBillingPeriod,
  isBillingDue
} = require('../services/billingScheduleService');

const { validateSubscriptionEligibility } = require('../services/billingEligibilityService');
const { generateSourceReference, buildInvoicePayload, validateInvoicePayload } = require('../services/invoicePayloadBuilder');
const { generateIdempotencyKey, reserveBillingExecution } = require('../services/billingIdempotencyService');
const { executeBillingRun, processSubscriptionBilling } = require('../services/recurringBillingEngine');

describe('M9 - Recurring Billing & Invoice Generation Engine Tests', () => {
  let adminToken;
  let staffToken;
  let customerToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean M9 collections so tests are completely idempotent
    await BillingSchedule.deleteMany({});
    await BillingRun.deleteMany({});
    await BillingExecution.deleteMany({});
    await BillingAttempt.deleteMany({});
    await BillingLog.deleteMany({});
    await BillingSequence.deleteMany({});

    subscriptionAdapter.resetSeedSubscriptions();
    invoiceAdapter.resetMockRepository();

    adminToken = generateDevToken({ id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io' });
    staffToken = generateDevToken({ id: 'usr_staff_001', role: 'staff', email: 'ops@brightloop.io' });
    customerToken = generateDevToken({ id: 'cust_001_intra_kerala', role: 'customer', email: 'finance@kochitechlabs.com' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Health Check API', () => {
    test('reports healthy status and lists M9 in active modules', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.modules).toEqual(expect.arrayContaining([expect.stringContaining('M9')]));
    });
  });

  describe('Billing Schedule Date Calculation Engine', () => {
    test('Leap year detection works correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });

    test('Days in month accurately reflects leap and non-leap years', () => {
      expect(getDaysInMonth(2026, 1)).toBe(28); // Feb 2026
      expect(getDaysInMonth(2024, 1)).toBe(29); // Feb 2024
      expect(getDaysInMonth(2026, 0)).toBe(31); // Jan 2026
      expect(getDaysInMonth(2026, 3)).toBe(30); // Apr 2026
    });

    test('Daily billing: advances exact interval days', () => {
      const base = new Date('2026-10-01T10:00:00Z');
      const next1 = calculateNextBillingDate(base, 'daily', 1);
      expect(next1.toISOString()).toBe('2026-10-02T10:00:00.000Z');

      const next3 = calculateNextBillingDate(base, 'daily', 3);
      expect(next3.toISOString()).toBe('2026-10-04T10:00:00.000Z');
    });

    test('Weekly billing: advances 7 days * interval', () => {
      const base = new Date('2026-10-01T10:00:00Z');
      const next1 = calculateNextBillingDate(base, 'weekly', 1);
      expect(next1.toISOString()).toBe('2026-10-08T10:00:00.000Z');

      const next2 = calculateNextBillingDate(base, 'weekly', 2);
      expect(next2.toISOString()).toBe('2026-10-15T10:00:00.000Z');
    });

    test('Monthly billing: advances months preserving day when valid', () => {
      const base = new Date('2026-03-15T10:00:00Z');
      const next = calculateNextBillingDate(base, 'monthly', 1);
      expect(next.toISOString()).toBe('2026-04-15T10:00:00.000Z');
    });

    test('Month-end policy: Jan 31 clamps to Feb 28 in non-leap year (2026)', () => {
      const jan31 = new Date('2026-01-31T00:00:00Z');
      const febNext = calculateNextBillingDate(jan31, 'monthly', 1);
      expect(febNext.getUTCFullYear()).toBe(2026);
      expect(febNext.getUTCMonth()).toBe(1); // February
      expect(febNext.getUTCDate()).toBe(28); // Clamped to 28
    });

    test('Month-end policy: Jan 31 clamps to Feb 29 in leap year (2024)', () => {
      const jan31 = new Date('2024-01-31T00:00:00Z');
      const febNext = calculateNextBillingDate(jan31, 'monthly', 1);
      expect(febNext.getUTCFullYear()).toBe(2024);
      expect(febNext.getUTCMonth()).toBe(1); // February
      expect(febNext.getUTCDate()).toBe(29); // Clamped to 29 in leap year
    });

    test('Yearly billing: Feb 29 in leap year clamps to Feb 28 in non-leap next year', () => {
      const leapFeb29 = new Date('2024-02-29T12:00:00Z');
      const nextYear = calculateNextBillingDate(leapFeb29, 'yearly', 1);
      expect(nextYear.getUTCFullYear()).toBe(2025);
      expect(nextYear.getUTCMonth()).toBe(1); // Feb
      expect(nextYear.getUTCDate()).toBe(28); // Clamped to 28
    });

    test('Billing period calculation generates non-overlapping start/end', () => {
      const periodStart = new Date('2026-05-01T00:00:00Z');
      const period = calculateBillingPeriod(periodStart, 'monthly', 1);
      expect(period.startDate.toISOString()).toBe('2026-05-01T00:00:00.000Z');
      expect(period.endDate.toISOString()).toBe('2026-05-31T23:59:59.999Z');
    });
  });

  describe('Billing Eligibility Validation', () => {
    test('Active subscription due today is verified as eligible', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_active_due_monthly_01');
      const res = await validateSubscriptionEligibility(sub, null, new Date());
      expect(res.eligible).toBe(true);
      expect(res.customer).toBeDefined();
      expect(res.plan).toBeDefined();
    });

    test('Future subscription is skipped as not yet due', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_future_not_due_05');
      const res = await validateSubscriptionEligibility(sub, null, new Date());
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('not yet due');
    });

    test('Paused subscription is rejected', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_paused_06');
      const res = await validateSubscriptionEligibility(sub, null, new Date());
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("status 'paused'");
    });

    test('Cancelled subscription is rejected', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_cancelled_07');
      const res = await validateSubscriptionEligibility(sub, null, new Date());
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("status 'cancelled'");
    });

    test('Subscription with invalid plan is rejected', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_invalid_plan_09');
      const res = await validateSubscriptionEligibility(sub, null, new Date());
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('does not exist');
    });
  });

  describe('Invoice Payload Builder', () => {
    test('Builds valid standardized invoice payload without tax calculation', async () => {
      const sub = await subscriptionAdapter.getSubscriptionById('sub_active_due_monthly_01');
      const plan = await subscriptionAdapter.getSubscriptionBillingDetails('sub_active_due_monthly_01');
      const customer = { customerId: 'cust_001', name: 'Test' };
      const period = { startDate: new Date('2026-10-01'), endDate: new Date('2026-10-31') };

      const payload = buildInvoicePayload({
        subscription: sub,
        plan: { planId: 'plan_starter_monthly_03', name: 'Starter', price: 3300, currency: 'INR', billingFrequency: 'monthly' },
        customer,
        billingPeriod: period,
        idempotencyKey: 'TEST-IDEMP-001'
      });

      expect(payload.source).toBe('M9_RECURRING_BILLING');
      expect(payload.sourceReference).toMatch(/^BILL-/);
      expect(payload.items[0].unitPrice).toBe(3300);
      expect(payload.items[0].quantity).toBe(1);
      expect(payload.taxAmount).toBeUndefined(); // M9 must NOT calculate tax

      const validation = validateInvoicePayload(payload);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Idempotency & Duplicate Billing Prevention', () => {
    test('Prevents duplicate billing execution for identical idempotency key', async () => {
      const run = await BillingRun.create({
        runReference: 'RUN-TEST-IDEMP-01',
        triggerType: 'manual',
        status: 'processing'
      });

      const pStart = new Date('2026-10-01T00:00:00Z');
      const pEnd = new Date('2026-10-31T23:59:59Z');
      const key = generateIdempotencyKey('sub_test_idemp_100', pStart, pEnd);

      const res1 = await reserveBillingExecution({
        billingRunId: run._id,
        subscriptionId: 'sub_test_idemp_100',
        customerId: 'cust_001',
        planId: 'plan_starter_monthly_03',
        billingPeriodStart: pStart,
        billingPeriodEnd: pEnd,
        billingAmount: 3300,
        idempotencyKey: key,
        sourceReference: 'BILL-TEST-001'
      });

      expect(res1.reserved).toBe(true);

      // Attempt second reservation with identical idempotencyKey
      const res2 = await reserveBillingExecution({
        billingRunId: run._id,
        subscriptionId: 'sub_test_idemp_100',
        customerId: 'cust_001',
        planId: 'plan_starter_monthly_03',
        billingPeriodStart: pStart,
        billingPeriodEnd: pEnd,
        billingAmount: 3300,
        idempotencyKey: key,
        sourceReference: 'BILL-TEST-002'
      });

      expect(res2.reserved).toBe(false);
      expect(res2.reason).toBe('concurrent_processing');
    });
  });

  describe('REST APIs: Billing Schedules & Runs', () => {
    test('Admin can create a new billing schedule via POST /api/billing/schedules', async () => {
      const res = await request(app)
        .post('/api/billing/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subscriptionId: 'sub_api_test_schedule_01',
          customerId: 'cust_001_intra_kerala',
          planId: 'plan_starter_monthly_03',
          billingFrequency: 'monthly',
          billingInterval: 1,
          amountSnapshot: 3300
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscriptionId).toBe('sub_api_test_schedule_01');
      expect(res.body.data.status).toBe('active');
    });

    test('Staff can list billing schedules via GET /api/billing/schedules', async () => {
      const res = await request(app)
        .get('/api/billing/schedules')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    test('Customer role receives 403 Forbidden on billing schedules', async () => {
      const res = await request(app)
        .get('/api/billing/schedules')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });

    test('Admin can trigger manual billing run via POST /api/billing/run', async () => {
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ asOfDate: new Date().toISOString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.run.runReference).toMatch(/^RUN-2026-\d{4}$/);
      expect(res.body.data.run.status).toMatch(/completed/);
    });

    test('Repeated manual billing run skips already billed subscriptions (Idempotent)', async () => {
      const res = await request(app)
        .post('/api/billing/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ asOfDate: new Date().toISOString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // All due subscriptions were billed in previous test, so eligible count or success count is 0
      expect(res.body.data.run.successCount).toBe(0);
    });

    test('GET /api/billing/runs returns list of runs with pagination', async () => {
      const res = await request(app)
        .get('/api/billing/runs')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/billing/summary returns dashboard KPI numbers', async () => {
      const res = await request(app)
        .get('/api/billing/summary')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSchedules).toBeDefined();
      expect(res.body.data.successExecutions).toBeDefined();
    });

    test('GET /api/billing/status returns scheduler state', async () => {
      const res = await request(app)
        .get('/api/billing/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.engine).toBe('active');
      expect(res.body.data.scheduler).toBeDefined();
    });

    test('Retry mechanism: schedules retry with backoff on M10 service failure', async () => {
      // Simulate invoice adapter temporary failure
      invoiceAdapter.setSimulateFailure(true);

      const runRes = await request(app)
        .post('/api/billing/subscriptions/sub_active_due_daily_03/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ asOfDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() });

      invoiceAdapter.setSimulateFailure(false);

      expect(runRes.statusCode).toBe(200);
      expect(runRes.body.data.result.status).toBe('failed');

      // Verify execution is marked retry_scheduled
      const failedExec = await BillingExecution.findOne({
        subscriptionId: 'sub_active_due_daily_03',
        status: 'retry_scheduled'
      });
      expect(failedExec).toBeDefined();
      expect(failedExec.nextRetryAt).toBeDefined();
      expect(failedExec.attemptCount).toBe(1);
    });
  });
});
