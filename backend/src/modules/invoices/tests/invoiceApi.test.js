const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const Invoice = require('../models/Invoice');
const TaxConfiguration = require('../models/TaxConfiguration');
const { generateDevToken } = require('../adapters/authAdapter');

describe('M10 - Invoice & Tax Management REST APIs', () => {
  let adminToken;
  let staffToken;
  let customer1Token;
  let customer2Token;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Generate tokens for each role
    adminToken = generateDevToken({ id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io' });
    staffToken = generateDevToken({ id: 'usr_staff_001', role: 'staff', email: 'staff@brightloop.io' });
    customer1Token = generateDevToken({ id: 'cust_001_intra_kerala', role: 'customer', email: 'finance@kochitechlabs.com' });
    customer2Token = generateDevToken({ id: 'cust_002_inter_bengaluru', role: 'customer', email: 'accounts@bengalurucloud.io' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/health', () => {
    test('returns 200 OK and system health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.module).toContain('M10');
    });
  });

  describe('Tax Configuration APIs', () => {
    test('Admin can list tax configurations', async () => {
      const res = await request(app)
        .get('/api/tax-configurations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('Staff cannot create tax configurations (Forbidden 403)', async () => {
      const res = await request(app)
        .post('/api/tax-configurations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Unauthorized Tax',
          code: 'UNAUTH',
          rate: 10
        });

      expect(res.statusCode).toBe(403);
    });

    test('Tax Preview calculation produces accurate GST breakdown without saving', async () => {
      const res = await request(app)
        .post('/api/tax-configurations/calculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplierState: 'Kerala',
          customerState: 'Kerala',
          items: [
            {
              itemName: 'Software License',
              quantity: 1,
              unitPrice: 1000,
              discountValue: 0,
              taxRate: 18,
              taxCode: 'GST18'
            }
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.subtotal).toBe(1000);
      expect(res.body.data.summary.cgstTotal).toBe(90);
      expect(res.body.data.summary.sgstTotal).toBe(90);
      expect(res.body.data.summary.grandTotal).toBe(1180);
    });
  });

  describe('Invoice Management Lifecycle', () => {
    let createdInvoiceId;
    let createdInvoiceNumber;

    test('Admin can create a manual draft invoice with accurate GST', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: 'cust_001_intra_kerala',
          notes: 'Test draft invoice',
          items: [
            {
              itemName: 'Brightloop SaaS Test Plan',
              quantity: 2,
              unitPrice: 3000,
              discountType: 'percentage',
              discountValue: 10, // 600 discount -> 5400 taxable
              taxCode: 'GST18'
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.invoiceNumber).toMatch(/^INV-2026-\d{4}$/);
      expect(res.body.data.subtotal).toBe(6000);
      expect(res.body.data.discountTotal).toBe(600);
      expect(res.body.data.taxableAmount).toBe(5400);
      expect(res.body.data.taxBreakdown.cgstTotal).toBe(486);
      expect(res.body.data.taxBreakdown.sgstTotal).toBe(486);
      expect(res.body.data.grandTotal).toBe(6372);

      createdInvoiceId = res.body.data._id;
      createdInvoiceNumber = res.body.data.invoiceNumber;
    });

    test('Admin can update draft invoice line items and notes', async () => {
      const res = await request(app)
        .put(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated draft notes',
          items: [
            {
              itemName: 'Brightloop SaaS Test Plan Updated',
              quantity: 1,
              unitPrice: 3000,
              discountType: 'percentage',
              discountValue: 0,
              taxCode: 'GST18'
            }
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notes).toBe('Updated draft notes');
      expect(res.body.data.subtotal).toBe(3000);
      expect(res.body.data.grandTotal).toBe(3540);
    });

    test('Admin can issue draft invoice into official issued status', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${createdInvoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('issued');
      expect(res.body.data.issuedAt).toBeDefined();
    });

    test('Issued invoice cannot be edited (Locked financial details)', async () => {
      const res = await request(app)
        .put(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Attempted modification on issued invoice'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Cannot modify invoice in "issued" status');
    });

    test('Customer can access their own invoice', async () => {
      const res = await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(createdInvoiceId);
    });

    test('Customer cannot access another customer invoice (Isolation 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    test('Print view returns structured invoice representation', async () => {
      const res = await request(app)
        .get(`/api/invoices/${createdInvoiceId}/print`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.invoice.invoiceNumber).toBe(createdInvoiceNumber);
      expect(res.body.data.printedAt).toBeDefined();
    });

    test('Admin can cancel eligible issued invoice with audit reason', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${createdInvoiceId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test cancellation scenario' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
      expect(res.body.data.cancellationReason).toBe('Test cancellation scenario');
    });
  });

  describe('Billing Ingestion Idempotency (M9 Integration Contract)', () => {
    test('Repeated webhook with same sourceReference returns existing invoice without creating duplicate', async () => {
      const sourceRef = `IDEMP-TEST-${Date.now()}`;
      const payload = {
        sourceReference: sourceRef,
        subscriptionId: 'sub_test_idemp_99',
        customerId: 'cust_001_intra_kerala',
        items: [
          {
            itemName: 'Subscription Ingestion Test',
            quantity: 1,
            unitPrice: 5000,
            taxCode: 'GST18'
          }
        ]
      };

      // First delivery
      const res1 = await request(app)
        .post('/api/invoices/billing-webhook')
        .send(payload);

      expect(res1.statusCode).toBe(201);
      expect(res1.body.isDuplicate).toBe(false);
      const firstInvoiceId = res1.body.data._id;

      // Second delivery (retry)
      const res2 = await request(app)
        .post('/api/invoices/billing-webhook')
        .send(payload);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.isDuplicate).toBe(true);
      expect(res2.body.data._id).toBe(firstInvoiceId);
    });
  });
});
