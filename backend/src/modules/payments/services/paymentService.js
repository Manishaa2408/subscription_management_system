const Payment = require('../models/Payment');
const customerAdapter = require('../adapters/customerAdapter');
const invoiceAdapter = require('../adapters/invoiceAdapter');
const { generatePaymentReference } = require('./paymentSequenceService');
const { validatePaymentAllocation } = require('./paymentAllocationService');
const { syncInvoicePaymentSummary } = require('./invoicePaymentSyncService');
const { generateReceipt } = require('./receiptService');

/**
 * Record a payment against an invoice
 */
const recordPayment = async (paymentData, user) => {
  const {
    invoiceId,
    customerId,
    amount,
    paymentMethod = 'bank_transfer',
    transactionReference,
    gatewayReference,
    paymentDate,
    description,
    status = 'completed',
    notes
  } = paymentData;

  if (!invoiceId) throw new Error('Invoice ID is required to record a payment');
  if (!amount || Number(amount) <= 0) throw new Error('Payment amount must be greater than zero');

  // Verify invoice details
  const invoice = await invoiceAdapter.getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice with ID "${invoiceId}" not found`);
  }

  // Resolve target customer
  const targetCustomerId = customerId || invoice.customerId;
  const customerDetails = await customerAdapter.getCustomerDetails(targetCustomerId);

  // Validate allocation and balance limits
  await validatePaymentAllocation({
    invoiceId: invoice._id || invoice.id || invoiceId,
    customerId: targetCustomerId,
    amount,
    transactionReference
  });

  const paymentReference = await generatePaymentReference(new Date().getFullYear());

  const payment = new Payment({
    paymentReference,
    customerId: targetCustomerId,
    customerSnapshot: {
      name: customerDetails?.name || invoice.customerSnapshot?.name || 'Customer',
      email: customerDetails?.email || invoice.customerSnapshot?.email || '',
      phone: customerDetails?.phone || invoice.customerSnapshot?.phone || ''
    },
    invoiceId: invoice._id ? invoice._id.toString() : invoiceId.toString(),
    invoiceReference: invoice.invoiceNumber || 'INV',
    subscriptionId: invoice.subscriptionId || null,
    amount: Math.round(Number(amount) * 100) / 100,
    currency: paymentData.currency || invoice.currency || 'INR',
    paymentMethod,
    transactionReference: transactionReference ? transactionReference.trim() : '',
    gatewayReference: gatewayReference ? gatewayReference.trim() : null,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    status,
    description: description || `Payment for invoice ${invoice.invoiceNumber || invoiceId}`,
    recordedBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
    verifiedBy: status === 'completed' && user ? { id: user.id, role: user.role, email: user.email, name: user.name } : null,
    verifiedAt: status === 'completed' ? new Date() : null,
    notes: notes || ''
  });

  await payment.save();

  // If completed, generate official receipt and synchronize invoice balance
  let receipt = null;
  if (payment.status === 'completed') {
    receipt = await generateReceipt(payment);
    await syncInvoicePaymentSummary(payment.invoiceId);
  }

  return {
    payment,
    receipt
  };
};

/**
 * Verify a pending payment
 */
const verifyPayment = async (paymentId, user) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status === 'completed') {
    return { payment, message: 'Payment is already completed' };
  }

  if (payment.status !== 'pending') {
    throw new Error(`Cannot verify payment in "${payment.status}" status`);
  }

  // Validate balance before marking completed
  await validatePaymentAllocation({
    invoiceId: payment.invoiceId,
    customerId: payment.customerId,
    amount: payment.amount
  });

  payment.status = 'completed';
  payment.verifiedBy = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined;
  payment.verifiedAt = new Date();
  await payment.save();

  // Generate receipt and update invoice
  const receipt = await generateReceipt(payment);
  await syncInvoicePaymentSummary(payment.invoiceId);

  return { payment, receipt };
};

/**
 * Mark a payment as failed
 */
const failPayment = async (paymentId, reason, user) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.status === 'completed') {
    throw new Error('Cannot mark a completed payment as failed');
  }

  payment.status = 'failed';
  payment.notes = payment.notes 
    ? `${payment.notes} | Failure reason: ${reason || 'Payment failed'}` 
    : `Failure reason: ${reason || 'Payment failed'}`;

  await payment.save();
  await syncInvoicePaymentSummary(payment.invoiceId);

  return payment;
};

/**
 * List payments with filters, pagination, and role-based scoping
 */
const getPayments = async (queryParams = {}, user = null) => {
  const {
    search,
    customerId,
    invoiceId,
    status,
    paymentMethod,
    reconciliationStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
    sortBy = 'paymentDate',
    sortOrder = 'desc'
  } = queryParams;

  const query = {};

  // Customer ownership isolation
  if (user && user.role === 'customer') {
    query.customerId = user.id;
  } else if (customerId) {
    query.customerId = customerId;
  }

  if (invoiceId) query.invoiceId = invoiceId;
  if (status && status !== 'all') query.status = status;
  if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
  if (reconciliationStatus && reconciliationStatus !== 'all') query.reconciliationStatus = reconciliationStatus;

  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(startDate);
    if (endDate) query.paymentDate.$lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = Number(minAmount);
    if (maxAmount) query.amount.$lte = Number(maxAmount);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { paymentReference: { $regex: term, $options: 'i' } },
      { invoiceReference: { $regex: term, $options: 'i' } },
      { transactionReference: { $regex: term, $options: 'i' } },
      { 'customerSnapshot.name': { $regex: term, $options: 'i' } },
      { 'customerSnapshot.email': { $regex: term, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const validSorts = ['paymentDate', 'amount', 'createdAt', 'paymentReference', 'status'];
  const actualSort = validSorts.includes(sortBy) ? sortBy : 'paymentDate';

  const [payments, totalCount] = await Promise.all([
    Payment.find(query)
      .sort({ [actualSort]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Payment.countDocuments(query)
  ]);

  return {
    payments,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    }
  };
};

/**
 * Get payment by ID with customer ownership validation
 */
const getPaymentById = async (paymentId, user = null) => {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) return null;

  if (user && user.role === 'customer' && payment.customerId !== user.id) {
    const err = new Error('Access denied: You can only view your own payment records');
    err.statusCode = 403;
    throw err;
  }

  return payment;
};

/**
 * Analytics summary for M12 Dashboard
 */
const getAnalyticsSummary = async () => {
  const allPayments = await Payment.find().lean();

  let totalCollected = 0;
  let totalPending = 0;
  let totalFailed = 0;
  let totalRefunded = 0;

  const methodBreakdown = {
    upi: 0,
    bank_transfer: 0,
    card: 0,
    cash: 0,
    cheque: 0,
    other: 0
  };

  const statusCounts = {
    completed: 0,
    pending: 0,
    failed: 0,
    cancelled: 0,
    refunded: 0,
    partially_refunded: 0
  };

  allPayments.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;

    if (p.status === 'completed') {
      totalCollected += p.amount || 0;
      methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + (p.amount || 0);
    } else if (p.status === 'pending') {
      totalPending += p.amount || 0;
    } else if (p.status === 'failed') {
      totalFailed += p.amount || 0;
    } else if (p.status === 'refunded') {
      totalRefunded += p.amount || 0;
    }
  });

  return {
    totalPaymentsCount: allPayments.length,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    totalFailed: Math.round(totalFailed * 100) / 100,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    methodBreakdown,
    statusCounts
  };
};

module.exports = {
  recordPayment,
  verifyPayment,
  failPayment,
  getPayments,
  getPaymentById,
  getAnalyticsSummary
};
