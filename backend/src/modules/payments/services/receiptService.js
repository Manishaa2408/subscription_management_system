const PaymentReceipt = require('../models/PaymentReceipt');
const Payment = require('../models/Payment');
const { generateReceiptReference } = require('./paymentSequenceService');

/**
 * Generates an official payment receipt for a completed payment
 * @param {Object} payment Payment document
 */
const generateReceipt = async (payment) => {
  if (!payment) throw new Error('Payment document required to generate receipt');

  if (payment.status !== 'completed') {
    throw new Error(`Receipts can only be generated for completed payments. Current status: ${payment.status}`);
  }

  // If receipt already exists, return existing
  const existing = await PaymentReceipt.findOne({ paymentId: payment._id });
  if (existing) {
    return existing;
  }

  const receiptNumber = await generateReceiptReference(new Date().getFullYear());

  const receipt = new PaymentReceipt({
    receiptNumber,
    paymentId: payment._id,
    paymentReference: payment.paymentReference,
    customerId: payment.customerId,
    customerName: payment.customerSnapshot?.name || 'Customer',
    customerEmail: payment.customerSnapshot?.email || '',
    invoiceId: payment.invoiceId,
    invoiceReference: payment.invoiceReference,
    amount: payment.amount,
    currency: payment.currency || 'INR',
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference || '',
    issuedAt: new Date(),
    companySnapshot: {
      name: process.env.COMPANY_NAME || 'Brightloop Software',
      gstin: process.env.COMPANY_GSTIN || '32AABCB1234D1Z8',
      address: process.env.COMPANY_ADDRESS || 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042',
      email: process.env.COMPANY_EMAIL || 'billing@brightloop.io',
      phone: process.env.COMPANY_PHONE || '+91 484 290 8800'
    }
  });

  await receipt.save();

  // Link receiptNumber on payment record
  payment.receiptNumber = receiptNumber;
  await payment.save();

  return receipt;
};

/**
 * Get receipt by ID with customer ownership validation
 */
const getReceiptById = async (receiptId, user = null) => {
  const receipt = await PaymentReceipt.findById(receiptId).lean();
  if (!receipt) return null;

  if (user && user.role === 'customer' && receipt.customerId !== user.id) {
    const err = new Error('Access denied: You can only view your own receipts');
    err.statusCode = 403;
    throw err;
  }

  return receipt;
};

/**
 * Get receipt by Payment ID
 */
const getReceiptByPaymentId = async (paymentId, user = null) => {
  const receipt = await PaymentReceipt.findOne({ paymentId }).lean();
  if (!receipt) return null;

  if (user && user.role === 'customer' && receipt.customerId !== user.id) {
    const err = new Error('Access denied: You can only view your own receipts');
    err.statusCode = 403;
    throw err;
  }

  return receipt;
};

module.exports = {
  generateReceipt,
  getReceiptById,
  getReceiptByPaymentId
};
