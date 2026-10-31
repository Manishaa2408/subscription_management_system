const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const Payment = require('../models/Payment');
const PaymentReceipt = require('../models/PaymentReceipt');
const BankTransaction = require('../models/BankTransaction');
const Reconciliation = require('../models/Reconciliation');
const Refund = require('../models/Refund');
const PaymentSequence = require('../models/PaymentSequence');
const { generateDevToken } = require('../adapters/authAdapter');
const { syncInvoicePaymentSummary } = require('../services/invoicePaymentSyncService');
const { runAutoMatching } = require('../services/autoMatchingService');
const { createRefund } = require('../services/refundService');

describe('M11 - Payment & Reconciliation Management Backend Test Suite', () => {
  let adminToken;
  let staffToken;
  let customer1Token;
  let customer2Token;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean M11 collections so tests are idempotent regardless of seed state
    await Payment.deleteMany({});
    await PaymentReceipt.deleteMany({});
    await BankTransaction.deleteMany({});
    await Reconciliation.deleteMany({});
    await Refund.deleteMany({});
    await PaymentSequence.deleteMany({});

    adminToken = generateDevToken({ id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io' });
    staffToken = generateDevToken({ id: 'usr_staff_001', role: 'staff', email: 'staff@brightloop.io' });
    customer1Token = generateDevToken({ id: 'cust_001_intra_kerala', role: 'customer', email: 'finance@kochitechlabs.com' });
    customer2Token = generateDevToken({ id: 'cust_002_inter_bengaluru', role: 'customer', email: 'accounts@bengalurucloud.io' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('reports healthy status and includes M11', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.modules).toContain('M11 - Payment & Reconciliation Management');
    });
  });

  describe('Payment Recording & Allocation', () => {
    let testPaymentId;
    let testPaymentRef;

    test('Admin can record a partial payment against an invoice', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_002', // Grand total: ₹16,815, Outstanding: ₹16,815
          customerId: 'cust_002_inter_bengaluru',
          amount: 5000,
          paymentMethod: 'bank_transfer',
          transactionReference: `NEFT-TEST-${Date.now()}`,
          status: 'completed',
          notes: 'Test partial payment'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.paymentReference).toMatch(/^PAY-2026-\d{4}$/);
      expect(res.body.data.payment.amount).toBe(5000);
      expect(res.body.data.payment.status).toBe('completed');
      expect(res.body.data.receipt).toBeDefined();
      expect(res.body.data.receipt.receiptNumber).toMatch(/^REC-2026-\d{4}$/);

      testPaymentId = res.body.data.payment._id;
      testPaymentRef = res.body.data.payment.paymentReference;
    });

    test('Overpayment rejection: rejects payment exceeding outstanding balance', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_005', // Outstanding is ₹916 (1416 - 500 seed payment)
          customerId: 'cust_004_intra_consumer',
          amount: 50000, // Excessive amount!
          paymentMethod: 'bank_transfer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('exceeds the current outstanding balance');
    });

    test('Rejects non-positive payment amounts', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_001',
          amount: -500,
          paymentMethod: 'cash'
        });

      expect(res.statusCode).toBe(400);
    });

    test('Customer mismatch rejection: rejects allocation if customer does not match invoice', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_001', // Owned by cust_001_intra_kerala
          customerId: 'cust_002_inter_bengaluru', // Wrong customer!
          amount: 500
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('does not match invoice customer');
    });

    test('Duplicate transaction reference prevention', async () => {
      const uniqueTxn = `TXN-DUP-TEST-${Date.now()}`;

      // First payment with txn ref
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_002',
          amount: 100,
          paymentMethod: 'upi',
          transactionReference: uniqueTxn
        });

      // Second payment with same txn ref
      const res2 = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_002',
          amount: 200,
          paymentMethod: 'upi',
          transactionReference: uniqueTxn
        });

      expect(res2.statusCode).toBe(400);
      expect(res2.body.message).toContain('already exists');
    });
  });

  describe('Payment Verification & Lifecycle', () => {
    let pendingPaymentId;

    test('Can record a pending payment without generating receipt yet', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_002',
          customerId: 'cust_002_inter_bengaluru',
          amount: 1000,
          paymentMethod: 'upi',
          status: 'pending',
          transactionReference: `UPI-PENDING-${Date.now()}`
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.payment.status).toBe('pending');
      expect(res.body.data.receipt).toBeNull();
      pendingPaymentId = res.body.data.payment._id;
    });

    test('Admin can verify pending payment into completed state and issue receipt', async () => {
      const res = await request(app)
        .patch(`/api/payments/${pendingPaymentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.payment.status).toBe('completed');
      expect(res.body.data.payment.verifiedAt).toBeDefined();
      expect(res.body.data.receipt).toBeDefined();
    });

    test('Admin can mark an eligible pending payment as failed', async () => {
      const createRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'inv_mock_002',
          amount: 500,
          paymentMethod: 'card',
          status: 'pending',
          transactionReference: `TXN-FAIL-CANDIDATE-${Date.now()}`
        });

      const failId = createRes.body.data.payment._id;

      const res = await request(app)
        .patch(`/api/payments/${failId}/fail`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Payment gateway rejected customer card' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('failed');
      expect(res.body.data.notes).toContain('Payment gateway rejected');
    });
  });

  describe('Customer Ownership & Tenant Isolation', () => {
    test('Customer can access their own payment records', async () => {
      const res = await request(app)
        .get('/api/payments/my')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((p) => {
        expect(p.customerId).toBe('cust_002_inter_bengaluru');
      });
    });

    test('Customer cannot view another customer payment details (403 Forbidden)', async () => {
      // Find any payment (belongs to cust_002 from earlier tests)
      const p1Doc = await Payment.findOne({ customerId: 'cust_002_inter_bengaluru' });
      expect(p1Doc).toBeDefined();

      // Attempt to access with customer 1 token (different customer → should be 403)
      const res = await request(app)
        .get(`/api/payments/${p1Doc._id}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('Payment Reconciliation Engine', () => {
    test('Imports bank statement transactions successfully', async () => {
      const res = await request(app)
        .post('/api/reconciliation/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchId: `BATCH-TEST-${Date.now()}`,
          transactions: [
            {
              transactionReference: `TEST-STMT-CR-001-${Date.now()}`,
              transactionDate: new Date(),
              description: 'TEST BANK REMITTANCE 1',
              creditAmount: 3000,
              currency: 'INR'
            },
            {
              transactionReference: `TEST-STMT-CR-002-${Date.now()}`,
              transactionDate: new Date(),
              description: 'TEST BANK REMITTANCE 2',
              creditAmount: 1500,
              currency: 'INR'
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.importedCount).toBe(2);
    });

    test('Manual matching detects amount match and links records', async () => {
      const txnRef = `MANUAL-RECON-TXN-${Date.now()}`;

      // Create a test bank transaction
      const bankTxn = new BankTransaction({
        transactionReference: txnRef,
        transactionDate: new Date(),
        description: 'Manual match test remittance',
        creditAmount: 2500,
        currency: 'INR'
      });
      await bankTxn.save();

      // Create a test payment with matching amount
      const payment = new Payment({
        paymentReference: `PAY-MANUAL-${Date.now()}`,
        customerId: 'cust_001_intra_kerala',
        customerSnapshot: { name: 'Kochi Tech Labs', email: 'fin@ktl.com' },
        invoiceId: 'inv_mock_001',
        invoiceReference: 'INV-2026-0001',
        amount: 2500,
        paymentMethod: 'bank_transfer',
        transactionReference: txnRef,
        status: 'completed'
      });
      await payment.save();

      const res = await request(app)
        .post('/api/reconciliation/manual-match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankTransactionId: bankTxn._id,
          paymentId: payment._id,
          notes: 'Matched by auditor'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reconciliation.status).toBe('matched');
      expect(res.body.data.reconciliation.differenceAmount).toBe(0);

      // Verify double reconciliation is prevented
      const dupRes = await request(app)
        .post('/api/reconciliation/manual-match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankTransactionId: bankTxn._id,
          paymentId: payment._id
        });

      expect(dupRes.statusCode).toBe(400);
      expect(dupRes.body.message).toContain('already matched');
    });

    test('Manual matching detects discrepancy when bank and payment amounts differ', async () => {
      const bankTxn = new BankTransaction({
        transactionReference: `DISCREP-TXN-${Date.now()}`,
        transactionDate: new Date(),
        description: 'Bank payment with gateway deductions',
        creditAmount: 975, // ₹975 in bank
        currency: 'INR'
      });
      await bankTxn.save();

      const payment = new Payment({
        paymentReference: `PAY-DISCREP-${Date.now()}`,
        customerId: 'cust_001_intra_kerala',
        customerSnapshot: { name: 'Kochi Tech Labs', email: 'fin@ktl.com' },
        invoiceId: 'inv_mock_001',
        invoiceReference: 'INV-2026-0001',
        amount: 1000, // ₹1,000 in accounting records
        paymentMethod: 'bank_transfer',
        status: 'completed'
      });
      await payment.save();

      const res = await request(app)
        .post('/api/reconciliation/manual-match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankTransactionId: bankTxn._id,
          paymentId: payment._id,
          notes: 'Bank deduction of ₹25'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reconciliation.status).toBe('discrepancy');
      expect(res.body.data.reconciliation.differenceAmount).toBe(-25);
    });

    test('Automated matching pairs exact transaction reference records', async () => {
      const matchRef = `AUTO-MATCH-REF-${Date.now()}`;

      const bankTxn = new BankTransaction({
        transactionReference: matchRef,
        transactionDate: new Date(),
        description: 'Automated test remittance',
        creditAmount: 1800,
        currency: 'INR',
        reconciliationStatus: 'unmatched'
      });
      await bankTxn.save();

      const payment = new Payment({
        paymentReference: `PAY-AUTO-${Date.now()}`,
        customerId: 'cust_001_intra_kerala',
        customerSnapshot: { name: 'Kochi Tech Labs', email: 'fin@ktl.com' },
        invoiceId: 'inv_mock_001',
        invoiceReference: 'INV-2026-0001',
        amount: 1800,
        paymentMethod: 'upi',
        transactionReference: matchRef,
        status: 'completed',
        reconciliationStatus: 'unmatched'
      });
      await payment.save();

      const result = await runAutoMatching({ id: 'usr_admin_001', role: 'admin', name: 'Admin' });
      expect(result.matchedCount).toBeGreaterThanOrEqual(1);

      const updatedBankTxn = await BankTransaction.findById(bankTxn._id);
      expect(updatedBankTxn.reconciliationStatus).toBe('matched');
      expect(updatedBankTxn.matchedPaymentId.toString()).toBe(payment._id.toString());
    });
  });

  describe('Refund Processing', () => {
    test('Admin can process a partial refund and invoice balance synchronizes', async () => {
      // Create a completed payment
      const payment = new Payment({
        paymentReference: `PAY-FOR-REFUND-${Date.now()}`,
        customerId: 'cust_001_intra_kerala',
        customerSnapshot: { name: 'Kochi Tech Labs', email: 'fin@ktl.com' },
        invoiceId: 'inv_mock_001',
        invoiceReference: 'INV-2026-0001',
        amount: 1000,
        paymentMethod: 'bank_transfer',
        status: 'completed'
      });
      await payment.save();

      // Process ₹400 refund
      const refundResult = await createRefund(
        {
          paymentId: payment._id,
          amount: 400,
          reason: 'Customer requested plan downgrade adjustment'
        },
        { id: 'usr_admin_001', role: 'admin', name: 'Administrator' }
      );

      expect(refundResult.refund.refundReference).toMatch(/^REF-2026-\d{4}$/);
      expect(refundResult.refund.amount).toBe(400);
      expect(refundResult.payment.status).toBe('partially_refunded');

      // Attempting to refund more than remaining ₹600 fails
      await expect(
        createRefund(
          {
            paymentId: payment._id,
            amount: 800, // 400 + 800 = 1200 > 1000
            reason: 'Excessive refund'
          },
          { id: 'usr_admin_001', role: 'admin' }
        )
      ).rejects.toThrow('exceeds the maximum refundable balance');
    });
  });

  describe('Receipt Inspection API', () => {
    test('Can fetch receipt by ID and printable data', async () => {
      const receiptDoc = await PaymentReceipt.findOne();
      expect(receiptDoc).toBeDefined();

      const res = await request(app)
        .get(`/api/receipts/${receiptDoc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.receiptNumber).toBe(receiptDoc.receiptNumber);

      const printRes = await request(app)
        .get(`/api/receipts/${receiptDoc._id}/print`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(printRes.statusCode).toBe(200);
      expect(printRes.body.data.receipt).toBeDefined();
    });
  });
});
