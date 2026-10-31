const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../../../config/db');
const BillingSchedule = require('../models/BillingSchedule');
const BillingRun = require('../models/BillingRun');
const BillingExecution = require('../models/BillingExecution');
const BillingAttempt = require('../models/BillingAttempt');
const BillingLog = require('../models/BillingLog');
const BillingSequence = require('../models/BillingSequence');

const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const { calculateBillingPeriod, calculateNextBillingDate } = require('../services/billingScheduleService');
const { generateSourceReference } = require('../services/invoicePayloadBuilder');
const { generateIdempotencyKey } = require('../services/billingIdempotencyService');

const seedBilling = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Seed:M9] Cannot execute development seed in production environment!');
    process.exit(1);
  }

  try {
    console.log('[Seed:M9] Connecting to database...');
    await connectDB();

    console.log('[Seed:M9] Resetting M9 collections...');
    await Promise.all([
      BillingSchedule.deleteMany({}),
      BillingRun.deleteMany({}),
      BillingExecution.deleteMany({}),
      BillingAttempt.deleteMany({}),
      BillingLog.deleteMany({}),
      BillingSequence.deleteMany({ prefix: { $in: ['RUN', 'BILL'] } })
    ]);

    subscriptionAdapter.resetSeedSubscriptions();

    console.log('[Seed:M9] Seeding initial Billing Schedules...');
    const now = new Date();
    const pastStart = new Date('2026-01-01T00:00:00Z');

    // 1. Daily Schedule (Due today)
    const dailyPeriod = calculateBillingPeriod(now, 'daily', 1);
    await BillingSchedule.create({
      subscriptionId: 'sub_active_due_daily_03',
      customerId: 'cust_003_inter_chennai',
      planId: 'plan_daily_metered_01',
      billingFrequency: 'daily',
      billingInterval: 1,
      billingStartDate: pastStart,
      currentPeriodStart: dailyPeriod.startDate,
      currentPeriodEnd: dailyPeriod.endDate,
      nextBillingDate: now,
      status: 'active',
      currency: 'INR',
      amountSnapshot: 300
    });

    // 2. Weekly Schedule (Past due)
    const weeklyStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const weeklyPeriod = calculateBillingPeriod(weeklyStart, 'weekly', 1);
    await BillingSchedule.create({
      subscriptionId: 'sub_active_due_weekly_02',
      customerId: 'cust_002_inter_bengaluru',
      planId: 'plan_weekly_sprint_02',
      billingFrequency: 'weekly',
      billingInterval: 1,
      billingStartDate: pastStart,
      currentPeriodStart: weeklyPeriod.startDate,
      currentPeriodEnd: weeklyPeriod.endDate,
      nextBillingDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      status: 'active',
      currency: 'INR',
      amountSnapshot: 750
    });

    // 3. Monthly Schedule (Due)
    const monthlyStart = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);
    const monthlyPeriod = calculateBillingPeriod(monthlyStart, 'monthly', 1);
    await BillingSchedule.create({
      subscriptionId: 'sub_active_due_monthly_01',
      customerId: 'cust_001_intra_kerala',
      planId: 'plan_starter_monthly_03',
      billingFrequency: 'monthly',
      billingInterval: 1,
      billingStartDate: pastStart,
      currentPeriodStart: monthlyPeriod.startDate,
      currentPeriodEnd: monthlyPeriod.endDate,
      nextBillingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      currency: 'INR',
      amountSnapshot: 3300
    });

    // 4. Yearly Schedule (Past due)
    const yearlyStart = new Date('2025-10-31T00:00:00Z');
    const yearlyPeriod = calculateBillingPeriod(yearlyStart, 'yearly', 1);
    await BillingSchedule.create({
      subscriptionId: 'sub_active_due_yearly_04',
      customerId: 'cust_001_intra_kerala',
      planId: 'plan_enterprise_yearly_05',
      billingFrequency: 'yearly',
      billingInterval: 1,
      billingStartDate: yearlyStart,
      currentPeriodStart: yearlyPeriod.startDate,
      currentPeriodEnd: yearlyPeriod.endDate,
      nextBillingDate: new Date('2026-10-31T00:00:00Z'),
      status: 'active',
      currency: 'INR',
      amountSnapshot: 120000
    });

    // 5. Future Not-Due Schedule
    const futureNext = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000);
    const futurePeriod = calculateBillingPeriod(now, 'monthly', 1);
    await BillingSchedule.create({
      subscriptionId: 'sub_future_not_due_05',
      customerId: 'cust_002_inter_bengaluru',
      planId: 'plan_pro_monthly_04',
      billingFrequency: 'monthly',
      billingInterval: 1,
      billingStartDate: now,
      currentPeriodStart: futurePeriod.startDate,
      currentPeriodEnd: futurePeriod.endDate,
      nextBillingDate: futureNext,
      status: 'active',
      currency: 'INR',
      amountSnapshot: 14250
    });

    // 6. Paused Schedule
    await BillingSchedule.create({
      subscriptionId: 'sub_paused_06',
      customerId: 'cust_003_inter_chennai',
      planId: 'plan_starter_monthly_03',
      billingFrequency: 'monthly',
      billingInterval: 1,
      billingStartDate: pastStart,
      currentPeriodStart: monthlyPeriod.startDate,
      currentPeriodEnd: monthlyPeriod.endDate,
      nextBillingDate: now,
      status: 'paused',
      currency: 'INR',
      amountSnapshot: 3300
    });

    console.log('[Seed:M9] Seeding Historical Billing Runs & Executions...');
    // Create previous completed historical run
    const histRun = await BillingRun.create({
      runReference: 'RUN-2026-0001',
      triggerType: 'scheduled',
      triggeredBy: 'system_cron_scheduler',
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 4500),
      totalExamined: 3,
      eligibleCount: 3,
      successCount: 2,
      failedCount: 1,
      skippedCount: 0,
      status: 'completed_with_errors',
      summary: 'Processed 3 candidates: 2 succeeded, 1 failed, 0 skipped.'
    });

    // Execution 1: Successful monthly billing
    const exec1Start = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);
    const exec1End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const idemp1 = generateIdempotencyKey('sub_active_due_monthly_01', exec1Start, exec1End);
    const exec1 = await BillingExecution.create({
      billingRunId: histRun._id,
      subscriptionId: 'sub_active_due_monthly_01',
      customerId: 'cust_001_intra_kerala',
      planId: 'plan_starter_monthly_03',
      billingPeriodStart: exec1Start,
      billingPeriodEnd: exec1End,
      billingAmount: 3300,
      currency: 'INR',
      idempotencyKey: idemp1,
      sourceReference: generateSourceReference('sub_active_due_monthly_01', exec1Start),
      invoiceReference: 'INV-2026-8812',
      invoiceId: 'inv_mock_hist_01',
      attemptCount: 1,
      status: 'success',
      lastAttemptAt: histRun.startedAt
    });

    await BillingAttempt.create({
      billingExecutionId: exec1._id,
      attemptNumber: 1,
      attemptedAt: histRun.startedAt,
      status: 'success',
      requestReference: exec1.sourceReference,
      responseSummary: 'Invoice generated: INV-2026-8812'
    });

    // Execution 2: Failed execution with retry scheduled
    const exec2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const exec2End = new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000);
    const idemp2 = generateIdempotencyKey('sub_invalid_plan_09', exec2Start, exec2End);
    const retryDate = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins later
    const exec2 = await BillingExecution.create({
      billingRunId: histRun._id,
      subscriptionId: 'sub_invalid_plan_09',
      customerId: 'cust_002_inter_bengaluru',
      planId: 'plan_ghost_does_not_exist',
      billingPeriodStart: exec2Start,
      billingPeriodEnd: exec2End,
      billingAmount: 999,
      currency: 'INR',
      idempotencyKey: idemp2,
      sourceReference: generateSourceReference('sub_invalid_plan_09', exec2Start),
      attemptCount: 1,
      status: 'retry_scheduled',
      lastAttemptAt: histRun.startedAt,
      nextRetryAt: retryDate,
      errorMessage: "Plan 'plan_ghost_does_not_exist' does not exist"
    });

    await BillingAttempt.create({
      billingExecutionId: exec2._id,
      attemptNumber: 1,
      attemptedAt: histRun.startedAt,
      status: 'retry_scheduled',
      requestReference: exec2.sourceReference,
      errorMessage: "Plan 'plan_ghost_does_not_exist' does not exist",
      nextRetryAt: retryDate
    });

    // Initialize sequences
    await BillingSequence.create({ prefix: 'RUN', year: new Date().getFullYear(), currentSequence: 1 });

    console.log('[Seed:M9] Successfully seeded M9 Recurring Billing database:');
    console.log('  - 6 Billing Schedules (Daily, Weekly, Monthly, Yearly, Future, Paused)');
    console.log('  - 1 Historical Billing Run (RUN-2026-0001)');
    console.log('  - 2 Billing Executions (1 Success with INV-2026-8812, 1 Retry Scheduled)');
    console.log('  - Audit logs and attempt history populated.');

    process.exit(0);
  } catch (err) {
    console.error('[Seed:M9] Seeding failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedBilling();
}

module.exports = seedBilling;
