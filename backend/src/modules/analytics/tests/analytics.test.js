const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');

const AnalyticsReport = require('../models/AnalyticsReport');
const DashboardPreference = require('../models/DashboardPreference');
const { generateDevToken } = require('../adapters/authAdapter');

const {
  calculatePercentageChange,
  calculateRevenueSummary,
  calculateCustomerGrowth,
  calculateSubscriptionGrowth,
  calculateBillingSuccessRate,
  calculateQuotationConversionRate
} = require('../services/analyticsCalculationService');

describe('M12 - Dashboard & Analytics Test Suite', () => {
  let adminToken;
  let staffToken;
  let customerToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await AnalyticsReport.deleteMany({});
    await DashboardPreference.deleteMany({});

    adminToken = generateDevToken({ id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io' });
    staffToken = generateDevToken({ id: 'usr_staff_001', role: 'staff', email: 'ops@brightloop.io' });
    customerToken = generateDevToken({ id: 'cust_001_intra_kerala', role: 'customer', email: 'finance@kochitechlabs.com' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Health Check Endpoint', () => {
    test('reports healthy status and includes M12 in active modules', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.modules).toEqual(expect.arrayContaining([expect.stringContaining('M12')]));
    });
  });

  describe('Analytics Calculation Engine', () => {
    test('calculatePercentageChange handles normal, zero-previous, and identical values', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20.0);
      expect(calculatePercentageChange(80, 100)).toBe(-20.0);
      expect(calculatePercentageChange(100, 0)).toBe(100.0);
      expect(calculatePercentageChange(0, 0)).toBe(0);
      expect(calculatePercentageChange(100, 100)).toBe(0);
    });

    test('Revenue summary maintains clear separation of invoiced vs collected revenue', async () => {
      const summary = await calculateRevenueSummary();
      expect(summary.totalInvoicedAmount).toBeGreaterThan(0);
      expect(summary.totalCollectedAmount).toBeGreaterThan(0);
      expect(summary.netCollectedAmount).toBeLessThanOrEqual(summary.totalCollectedAmount);
      expect(summary.outstandingAmount).toBeGreaterThanOrEqual(0);
      expect(summary.currency).toBe('INR');
    });

    test('Customer growth returns counts and timeline', async () => {
      const customers = await calculateCustomerGrowth();
      expect(customers.totalCustomers).toBeGreaterThanOrEqual(4);
      expect(customers.statusBreakdown).toBeDefined();
      expect(Array.isArray(customers.growthTimeline)).toBe(true);
    });

    test('Subscription analytics calculates churn and retention without division by zero', async () => {
      const subs = await calculateSubscriptionGrowth();
      expect(subs.totalSubscriptions).toBeGreaterThanOrEqual(5);
      expect(subs.churnRate).toBeGreaterThanOrEqual(0);
      expect(subs.retentionRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(subs.growthTimeline)).toBe(true);
    });

    test('Billing success rate calculates execution statistics', async () => {
      const billing = await calculateBillingSuccessRate();
      expect(billing.totalRuns).toBeDefined();
      expect(billing.successRate).toBeGreaterThanOrEqual(0);
    });

    test('Quotation conversion rate calculates accepted vs eligible percentages', async () => {
      const quot = await calculateQuotationConversionRate();
      expect(quot.conversionRate).toBeGreaterThan(0);
      expect(quot.acceptedCount).toBeDefined();
    });
  });

  describe('Main Dashboard REST APIs', () => {
    test('GET /api/dashboard/overview returns full executive KPI and chart dataset', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.revenue.invoiced).toBeGreaterThan(0);
      expect(res.body.data.kpis.customers.total).toBeGreaterThan(0);
      expect(res.body.data.kpis.subscriptions.active).toBeGreaterThan(0);
      expect(res.body.data.charts.revenueTrends).toBeDefined();
    });

    test('Staff role can access dashboard overview', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Customer role is forbidden from business-wide dashboard overview (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Section Analytics APIs', () => {
    test('GET /api/analytics/revenue/trends returns monthly revenue points', async () => {
      const res = await request(app)
        .get('/api/analytics/revenue/trends')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].collected).toBeDefined();
    });

    test('GET /api/analytics/revenue/by-product returns revenue share percentages', async () => {
      const res = await request(app)
        .get('/api/analytics/revenue/by-product')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].revenueShare).toBeDefined();
    });

    test('GET /api/analytics/subscriptions/churn returns churn and retention rates', async () => {
      const res = await request(app)
        .get('/api/analytics/subscriptions/churn')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.churnRate).toBeDefined();
      expect(res.body.data.retentionRate).toBeDefined();
    });

    test('GET /api/analytics/invoices/tax is restricted to Admin (Staff receives 403)', async () => {
      // Staff attempt
      const staffRes = await request(app)
        .get('/api/analytics/invoices/tax')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.statusCode).toBe(403);

      // Admin attempt
      const adminRes = await request(app)
        .get('/api/analytics/invoices/tax')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.statusCode).toBe(200);
      expect(adminRes.body.data.totalTax).toBeDefined();
    });

    test('GET /api/analytics/payments/methods returns method breakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/payments/methods')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.upi).toBeDefined();
    });
  });

  describe('Report Export APIs', () => {
    test('Admin can export revenue report as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('period,collected,refunds,net');
    });

    test('Admin can export customer report as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('customerId,name,email');
    });

    test('Admin can inspect generated report history', async () => {
      const res = await request(app)
        .get('/api/reports/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('Staff is denied access to report exports (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/export/revenue')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
