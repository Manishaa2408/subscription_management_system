require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../../config/db');
const Payment = require('../models/Payment');
const PaymentReceipt = require('../models/PaymentReceipt');
const BankTransaction = require('../models/BankTransaction');
const Reconciliation = require('../models/Reconciliation');
const Refund = require('../models/Refund');
const PaymentSequence = require('../models/PaymentSequence');
const { generateReceipt } = require('../services/receiptService');
const { syncInvoicePaymentSummary } = require('../services/invoicePaymentSyncService');
const invoiceAdapter = require('../adapters/invoiceAdapter');

const seedPaymentsAndReconciliation = async () => {
  try {
    console.log('[Seed:M11] Connecting to MongoDB...');
    await connectDB();

    // Reset payment sequences
    await PaymentSequence.findOneAndUpdate(
      { prefix: 'PAY', year: 2026 },
      { $set: { sequence: 6 } },
      { upsert: true }
    );
    await PaymentSequence.findOneAndUpdate(
      { prefix: 'REC', year: 2026 },
      { $set: { sequence: 4 } },
      { upsert: true }
    );
    await PaymentSequence.findOneAndUpdate(
      { prefix: 'REF', year: 2026 },
      { $set: { sequence: 1 } },
      { upsert: true }
    );

    // Clean previous seed test records
    await Payment.deleteMany({ paymentReference: /^PAY-2026-/ });
    await PaymentReceipt.deleteMany({ receiptNumber: /^REC-2026-/ });
    await BankTransaction.deleteMany({});
    await Reconciliation.deleteMany({});
    await Refund.deleteMany({ refundReference: /^REF-2026-/ });

    console.log('[Seed:M11] Creating realistic payment scenarios...');

    // 1. Completed UPI Partial Payment (₹2,000 against INV-2026-0001)
    const p1 = new Payment({
      paymentReference: 'PAY-2026-0001',
      customerId: 'cust_001_intra_kerala',
      customerSnapshot: {
        name: 'Kochi Tech Labs Pvt Ltd',
        email: 'finance@kochitechlabs.com',
        phone: '+91 484 242 1100'
      },
      invoiceId: 'inv_mock_001',
      invoiceReference: 'INV-2026-0001',
      amount: 2000,
      currency: 'INR',
      paymentMethod: 'upi',
      transactionReference: 'UPI-REF-9928172635',
      paymentDate: new Date('2026-10-26T11:30:00Z'),
      status: 'completed',
      description: 'First installment payment for cloud subscription',
      recordedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedAt: new Date('2026-10-26T11:35:00Z'),
      reconciliationStatus: 'unmatched',
      notes: 'Received via HDFC UPI QR code'
    });
    await p1.save();
    await generateReceipt(p1);

    // 2. Completed Second Partial Payment (₹1,000 against INV-2026-0001)
    const p2 = new Payment({
      paymentReference: 'PAY-2026-0002',
      customerId: 'cust_001_intra_kerala',
      customerSnapshot: {
        name: 'Kochi Tech Labs Pvt Ltd',
        email: 'finance@kochitechlabs.com',
        phone: '+91 484 242 1100'
      },
      invoiceId: 'inv_mock_001',
      invoiceReference: 'INV-2026-0001',
      amount: 1000,
      currency: 'INR',
      paymentMethod: 'bank_transfer',
      transactionReference: 'NEFT-HDFC-88273641',
      paymentDate: new Date('2026-10-28T14:15:00Z'),
      status: 'completed',
      description: 'Second installment payment',
      recordedBy: { id: 'usr_staff_001', role: 'staff', email: 'staff@brightloop.io', name: 'Ops Staff' },
      verifiedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedAt: new Date('2026-10-28T14:20:00Z'),
      reconciliationStatus: 'unmatched',
      notes: 'NEFT credit from customer current account'
    });
    await p2.save();
    await generateReceipt(p2);
    await syncInvoicePaymentSummary('inv_mock_001');

    // 3. Completed Full Payment via Bank Transfer (₹45,135 for INV-2026-0004)
    const p3 = new Payment({
      paymentReference: 'PAY-2026-0003',
      customerId: 'cust_003_inter_chennai',
      customerSnapshot: {
        name: 'Chennai Retail Solutions',
        email: 'billing@chennairetail.in',
        phone: '+91 44 2828 9000'
      },
      invoiceId: 'inv_mock_004',
      invoiceReference: 'INV-2026-0004',
      amount: 45135,
      currency: 'INR',
      paymentMethod: 'bank_transfer',
      transactionReference: 'RTGS-ICICI-00998877',
      paymentDate: new Date('2026-10-02T10:00:00Z'),
      status: 'completed',
      description: 'Annual growth advance subscription payment in full',
      recordedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedAt: new Date('2026-10-02T10:10:00Z'),
      reconciliationStatus: 'matched',
      notes: 'RTGS remittance confirmed by bank'
    });
    await p3.save();
    await generateReceipt(p3);
    await syncInvoicePaymentSummary('inv_mock_004');

    // 4. Pending Online Payment (₹5,000 for INV-2026-0002)
    const p4 = new Payment({
      paymentReference: 'PAY-2026-0004',
      customerId: 'cust_002_inter_bengaluru',
      customerSnapshot: {
        name: 'Bengaluru Cloud Systems LLP',
        email: 'accounts@bengalurucloud.io',
        phone: '+91 80 4111 2233'
      },
      invoiceId: 'inv_mock_002',
      invoiceReference: 'INV-2026-0002',
      amount: 5000,
      currency: 'INR',
      paymentMethod: 'card',
      transactionReference: 'TXN-GATEWAY-PENDING-4433',
      paymentDate: new Date('2026-10-29T16:00:00Z'),
      status: 'pending',
      description: 'Corporate corporate credit card payment initiated',
      recordedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      reconciliationStatus: 'unmatched',
      notes: 'Awaiting 2FA authorization from cardholder bank'
    });
    await p4.save();

    // 5. Failed Card Payment (₹16,815 for INV-2026-0002)
    const p5 = new Payment({
      paymentReference: 'PAY-2026-0005',
      customerId: 'cust_002_inter_bengaluru',
      customerSnapshot: {
        name: 'Bengaluru Cloud Systems LLP',
        email: 'accounts@bengalurucloud.io',
        phone: '+91 80 4111 2233'
      },
      invoiceId: 'inv_mock_002',
      invoiceReference: 'INV-2026-0002',
      amount: 16815,
      currency: 'INR',
      paymentMethod: 'card',
      transactionReference: 'TXN-FAIL-EXPIRED-CARD-11',
      paymentDate: new Date('2026-10-28T09:20:00Z'),
      status: 'failed',
      description: 'Attempted card settlement',
      recordedBy: { id: 'usr_staff_001', role: 'staff', email: 'staff@brightloop.io', name: 'Ops Staff' },
      reconciliationStatus: 'unmatched',
      notes: 'Declined by issuing bank: Card expired'
    });
    await p5.save();

    // 6. Completed Cash Payment (₹500 for INV-2026-0005)
    const p6 = new Payment({
      paymentReference: 'PAY-2026-0006',
      customerId: 'cust_004_intra_consumer',
      customerSnapshot: {
        name: 'Arun Kumar (Individual Consumer)',
        email: 'arun.kerala@example.com',
        phone: '+91 98470 12345'
      },
      invoiceId: 'inv_mock_005',
      invoiceReference: 'INV-2026-0005',
      amount: 500,
      currency: 'INR',
      paymentMethod: 'cash',
      transactionReference: 'CASH-REC-KOCHI-99',
      paymentDate: new Date('2026-10-27T15:40:00Z'),
      status: 'completed',
      description: 'Counter cash payment at Kochi branch',
      recordedBy: { id: 'usr_staff_001', role: 'staff', email: 'staff@brightloop.io', name: 'Ops Staff' },
      verifiedBy: { id: 'usr_admin_001', role: 'admin', email: 'admin@brightloop.io', name: 'Administrator' },
      verifiedAt: new Date('2026-10-27T15:45:00Z'),
      reconciliationStatus: 'unmatched',
      notes: 'Cash deposited in petty register'
    });
    await p6.save();
    await generateReceipt(p6);
    await syncInvoicePaymentSummary('inv_mock_005');

    console.log('[Seed:M11] Seeding bank statement transactions for reconciliation...');

    // Bank Transaction 1: Exact Match for RTGS (p3)
    const bt1 = new BankTransaction({
      transactionReference: 'RTGS-ICICI-00998877',
      transactionDate: new Date('2026-10-02T10:05:00Z'),
      description: 'RTGS CR/CHENNAI RETAIL SOLUTIONS/ANNUAL SAAS',
      creditAmount: 45135,
      debitAmount: 0,
      currency: 'INR',
      importBatchId: 'BATCH-SEED-OCT26',
      reconciliationStatus: 'matched',
      matchedPaymentId: p3._id,
      matchedPaymentReference: p3.paymentReference,
      matchedAt: new Date('2026-10-02T10:15:00Z'),
      notes: 'Automatic match via RTGS UTR reference'
    });
    await bt1.save();

    // Matching Reconciliation record
    const recon1 = new Reconciliation({
      paymentId: p3._id,
      paymentReference: p3.paymentReference,
      bankTransactionId: bt1._id,
      bankTransactionReference: bt1.transactionReference,
      matchedAmount: 45135,
      differenceAmount: 0,
      status: 'matched',
      matchType: 'exact_reference',
      notes: 'Initial seed matched reconciliation'
    });
    await recon1.save();

    // Bank Transaction 2: Exact Reference Match Candidate (UPI p1)
    const bt2 = new BankTransaction({
      transactionReference: 'UPI-REF-9928172635',
      transactionDate: new Date('2026-10-26T11:32:00Z'),
      description: 'UPI/9928172635/KOCHI TECH LABS/BRIGHTLOOP',
      creditAmount: 2000,
      debitAmount: 0,
      currency: 'INR',
      importBatchId: 'BATCH-SEED-OCT26',
      reconciliationStatus: 'unmatched',
      notes: 'Ready for auto-match testing'
    });
    await bt2.save();

    // Bank Transaction 3: Amount Discrepancy (Payment was ₹1000, Bank received ₹980 after ₹20 gateway fee)
    const bt3 = new BankTransaction({
      transactionReference: 'NEFT-HDFC-88273641',
      transactionDate: new Date('2026-10-28T14:18:00Z'),
      description: 'NEFT CR/KOCHI TECH LABS/INVOICE PAYMENT',
      creditAmount: 980,
      debitAmount: 0,
      currency: 'INR',
      importBatchId: 'BATCH-SEED-OCT26',
      reconciliationStatus: 'unmatched',
      notes: 'Amount discrepancy test candidate (₹1,000 vs ₹980)'
    });
    await bt3.save();

    // Bank Transaction 4: Unmatched Credit (Customer paid directly into bank without invoice reference)
    const bt4 = new BankTransaction({
      transactionReference: 'IMPS-DIRECT-55443322',
      transactionDate: new Date('2026-10-29T17:00:00Z'),
      description: 'IMPS/55443322/DIRECT TRANSFER UNKNOWN CLIENT',
      creditAmount: 7500,
      debitAmount: 0,
      currency: 'INR',
      importBatchId: 'BATCH-SEED-OCT26',
      reconciliationStatus: 'unmatched',
      notes: 'Unidentified client remittance for manual investigation'
    });
    await bt4.save();

    // Bank Transaction 5: Bank Maintenance Fee Debit
    const bt5 = new BankTransaction({
      transactionReference: 'CHG-BANK-FEE-OCT26',
      transactionDate: new Date('2026-10-30T23:59:00Z'),
      description: 'MONTHLY CORPORATE CURRENT ACCOUNT CHARGES',
      creditAmount: 0,
      debitAmount: 550,
      currency: 'INR',
      importBatchId: 'BATCH-SEED-OCT26',
      reconciliationStatus: 'ignored',
      notes: 'Operational bank fee; not linked to customer invoices'
    });
    await bt5.save();

    console.log('[Seed:M11] Successfully seeded M11 test data:');
    console.log('  - 6 Payments (UPI, Bank Transfer, Card, Cash across Completed, Pending, Failed)');
    console.log('  - 4 Unique Payment Receipts (REC-2026-0001 through 0004)');
    console.log('  - 5 Bank Transactions (Matched, Unmatched, Discrepancy, Debit)');
    console.log('  - Authoritative Invoice Payment Summaries synchronized.');

    process.exit(0);
  } catch (err) {
    console.error('[Seed:M11 Error] Failed to seed payments:', err);
    process.exit(1);
  }
};

seedPaymentsAndReconciliation();
