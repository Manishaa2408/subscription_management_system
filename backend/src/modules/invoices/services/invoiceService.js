const Invoice = require('../models/Invoice');
const InvoiceAuditLog = require('../models/InvoiceAuditLog');
const { generateInvoiceNumber } = require('./invoiceNumberService');
const { calculateInvoiceTotals } = require('./invoiceCalculationService');
const {
  canEditInvoice,
  canCancelInvoice,
  isValidTransition,
  evaluateEffectiveStatus
} = require('./invoiceStatusService');
const customerAdapter = require('../adapters/customerAdapter');
const paymentAdapter = require('../adapters/paymentAdapter');

/**
 * Creates an audit log entry for invoice operations
 */
const recordAuditLog = async ({
  invoiceId,
  invoiceNumber,
  action,
  previousValues,
  newValues,
  user,
  reason = ''
}) => {
  try {
    await InvoiceAuditLog.create({
      invoiceId,
      invoiceNumber,
      action,
      previousValues,
      newValues,
      performedBy: user ? {
        id: user.id || 'system',
        role: user.role || 'admin',
        email: user.email || 'admin@brightloop.io',
        name: user.name || 'System'
      } : undefined,
      reason
    });
  } catch (err) {
    console.error(`[Audit Log Error] Failed to write log for ${invoiceNumber}: ${err.message}`);
  }
};

/**
 * Creates a new manual draft invoice (Admin only)
 */
const createInvoice = async (invoiceData, user) => {
  const customerId = invoiceData.customerId;
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  // Retrieve customer details via adapter
  let customerDetails = await customerAdapter.getCustomerDetails(customerId);
  if (!customerDetails) {
    // If not found in adapter, use provided customerSnapshot if given
    if (invoiceData.customerSnapshot && invoiceData.customerSnapshot.name) {
      customerDetails = invoiceData.customerSnapshot;
    } else {
      throw new Error(`Customer with ID "${customerId}" could not be found`);
    }
  }

  const supplierState = process.env.COMPANY_STATE || 'Kerala';
  const customerState = customerDetails.state || 
    (customerDetails.billingAddress && customerDetails.billingAddress.state) || 
    'Kerala';

  // Calculate totals and line taxes
  const calculatedTotals = await calculateInvoiceTotals(
    invoiceData.items,
    supplierState,
    customerState
  );

  const invoiceNumber = await generateInvoiceNumber('INV', new Date().getFullYear());

  const issueDate = invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date();
  const dueDate = invoiceData.dueDate 
    ? new Date(invoiceData.dueDate) 
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // Default 15 days net

  const invoice = new Invoice({
    invoiceNumber,
    customerId,
    customerSnapshot: {
      name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone || '',
      gstin: customerDetails.gstin || '',
      state: customerState,
      billingAddress: customerDetails.billingAddress || {
        line1: '',
        city: '',
        state: customerState,
        postalCode: '',
        country: 'India'
      }
    },
    supplierSnapshot: {
      name: process.env.COMPANY_NAME || 'Brightloop Software',
      gstin: process.env.COMPANY_GSTIN || '32AABCB1234D1Z8',
      state: supplierState,
      email: process.env.COMPANY_EMAIL || 'billing@brightloop.io',
      phone: process.env.COMPANY_PHONE || '+91 484 290 8800',
      address: process.env.COMPANY_ADDRESS || 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
    },
    subscriptionId: invoiceData.subscriptionId || null,
    sourceReference: invoiceData.sourceReference || null,
    billingPeriod: invoiceData.billingPeriod || { startDate: null, endDate: null },
    issueDate,
    dueDate,
    items: calculatedTotals.items,
    subtotal: calculatedTotals.subtotal,
    discountTotal: calculatedTotals.discountTotal,
    taxableAmount: calculatedTotals.taxableAmount,
    taxBreakdown: calculatedTotals.taxBreakdown,
    taxTotal: calculatedTotals.taxTotal,
    grandTotal: calculatedTotals.grandTotal,
    amountPaid: 0,
    outstandingAmount: calculatedTotals.grandTotal,
    currency: invoiceData.currency || process.env.DEFAULT_CURRENCY || 'INR',
    status: 'draft',
    notes: invoiceData.notes || '',
    createdBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
    updatedBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined
  });

  await invoice.save();

  await recordAuditLog({
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'created',
    newValues: { status: 'draft', grandTotal: invoice.grandTotal },
    user,
    reason: 'Manual draft invoice created'
  });

  return invoice;
};

/**
 * Ingests a recurring billing payload from M9
 * Idempotent: if sourceReference already exists, returns existing invoice
 */
const createInvoiceFromBillingPayload = async (payload) => {
  if (!payload || !payload.sourceReference) {
    throw new Error('Billing payload must include a unique sourceReference for idempotency');
  }

  // Idempotency check
  const existing = await Invoice.findOne({ sourceReference: payload.sourceReference });
  if (existing) {
    return { invoice: existing, isDuplicate: true };
  }

  const customerId = payload.customerId;
  const customerDetails = await customerAdapter.getCustomerDetails(customerId);
  if (!customerDetails) {
    throw new Error(`Billing customer with ID "${customerId}" not found`);
  }

  const supplierState = process.env.COMPANY_STATE || 'Kerala';
  const customerState = customerDetails.state || 
    (customerDetails.billingAddress && customerDetails.billingAddress.state) || 
    'Kerala';

  const calculatedTotals = await calculateInvoiceTotals(
    payload.items,
    supplierState,
    customerState
  );

  const invoiceNumber = await generateInvoiceNumber('INV', new Date().getFullYear());
  const issueDate = payload.issueDate ? new Date(payload.issueDate) : new Date();
  const dueDate = payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const invoice = new Invoice({
    invoiceNumber,
    customerId,
    customerSnapshot: {
      name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone || '',
      gstin: customerDetails.gstin || '',
      state: customerState,
      billingAddress: customerDetails.billingAddress || {
        line1: '',
        city: '',
        state: customerState,
        postalCode: '',
        country: 'India'
      }
    },
    supplierSnapshot: {
      name: process.env.COMPANY_NAME || 'Brightloop Software',
      gstin: process.env.COMPANY_GSTIN || '32AABCB1234D1Z8',
      state: supplierState,
      email: process.env.COMPANY_EMAIL || 'billing@brightloop.io',
      phone: process.env.COMPANY_PHONE || '+91 484 290 8800',
      address: process.env.COMPANY_ADDRESS || 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
    },
    subscriptionId: payload.subscriptionId || null,
    sourceReference: payload.sourceReference,
    billingPeriod: payload.billingPeriod || { startDate: null, endDate: null },
    issueDate,
    dueDate,
    items: calculatedTotals.items,
    subtotal: calculatedTotals.subtotal,
    discountTotal: calculatedTotals.discountTotal,
    taxableAmount: calculatedTotals.taxableAmount,
    taxBreakdown: calculatedTotals.taxBreakdown,
    taxTotal: calculatedTotals.taxTotal,
    grandTotal: calculatedTotals.grandTotal,
    amountPaid: 0,
    outstandingAmount: calculatedTotals.grandTotal,
    currency: payload.currency || 'INR',
    status: 'issued', // Invoices generated from billing cycles start as issued
    issuedAt: new Date(),
    notes: payload.notes || 'Automatically generated subscription invoice',
    createdBy: { id: 'M9_BILLING_ENGINE', role: 'system', email: 'billing-engine@brightloop.io', name: 'M9 Billing Engine' },
    updatedBy: { id: 'M9_BILLING_ENGINE', role: 'system', email: 'billing-engine@brightloop.io', name: 'M9 Billing Engine' }
  });

  await invoice.save();

  await recordAuditLog({
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'issued',
    newValues: { status: 'issued', grandTotal: invoice.grandTotal, sourceReference: payload.sourceReference },
    user: { id: 'M9_BILLING_ENGINE', role: 'system', name: 'M9 Billing Engine' },
    reason: `Generated from recurring billing subscription ${payload.subscriptionId}`
  });

  return { invoice, isDuplicate: false };
};

/**
 * Updates an eligible draft invoice
 */
const updateDraftInvoice = async (invoiceId, updateData, user) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!canEditInvoice(invoice)) {
    throw new Error(`Cannot modify invoice in "${invoice.status}" status. Only draft invoices can be edited.`);
  }

  const previousSnapshot = {
    items: invoice.items,
    subtotal: invoice.subtotal,
    grandTotal: invoice.grandTotal,
    notes: invoice.notes
  };

  const supplierState = invoice.supplierSnapshot.state || 'Kerala';
  const customerState = invoice.customerSnapshot.state || 'Kerala';

  if (updateData.items && updateData.items.length > 0) {
    const calculatedTotals = await calculateInvoiceTotals(
      updateData.items,
      supplierState,
      customerState
    );

    invoice.items = calculatedTotals.items;
    invoice.subtotal = calculatedTotals.subtotal;
    invoice.discountTotal = calculatedTotals.discountTotal;
    invoice.taxableAmount = calculatedTotals.taxableAmount;
    invoice.taxBreakdown = calculatedTotals.taxBreakdown;
    invoice.taxTotal = calculatedTotals.taxTotal;
    invoice.grandTotal = calculatedTotals.grandTotal;
    invoice.outstandingAmount = calculatedTotals.grandTotal;
  }

  if (updateData.notes !== undefined) invoice.notes = updateData.notes;
  if (updateData.dueDate) invoice.dueDate = new Date(updateData.dueDate);
  if (updateData.issueDate) invoice.issueDate = new Date(updateData.issueDate);

  invoice.updatedBy = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined;
  await invoice.save();

  await recordAuditLog({
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'updated',
    previousValues: previousSnapshot,
    newValues: { grandTotal: invoice.grandTotal, itemsCount: invoice.items.length },
    user,
    reason: 'Draft invoice details updated'
  });

  return invoice;
};

/**
 * Issues a draft invoice
 */
const issueInvoice = async (invoiceId, user) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw new Error(`Only draft invoices can be issued. Current status: ${invoice.status}`);
  }

  invoice.status = 'issued';
  invoice.issuedAt = new Date();
  invoice.updatedBy = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined;

  await invoice.save();

  await recordAuditLog({
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'issued',
    previousValues: { status: 'draft' },
    newValues: { status: 'issued', issuedAt: invoice.issuedAt },
    user,
    reason: 'Invoice officially issued'
  });

  return invoice;
};

/**
 * Cancels an eligible invoice
 */
const cancelInvoice = async (invoiceId, reason, user) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!canCancelInvoice(invoice)) {
    throw new Error(`Cannot cancel invoice in "${invoice.status}" status with paid amount ₹${invoice.amountPaid}`);
  }

  const previousStatus = invoice.status;
  invoice.status = 'cancelled';
  invoice.cancellationReason = reason || 'Cancelled by administrator';
  invoice.cancelledAt = new Date();
  invoice.updatedBy = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined;

  await invoice.save();

  await recordAuditLog({
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'cancelled',
    previousValues: { status: previousStatus },
    newValues: { status: 'cancelled', cancellationReason: invoice.cancellationReason },
    user,
    reason: invoice.cancellationReason
  });

  return invoice;
};

/**
 * List invoices with filters, pagination, and role-based scoping
 */
const getInvoices = async (queryParams = {}, user = null) => {
  const {
    search,
    status,
    customerId,
    subscriptionId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;

  const query = {};

  // Role Scoping: Customers can ONLY see their own invoices
  if (user && user.role === 'customer') {
    query.customerId = user.id;
  } else if (customerId) {
    query.customerId = customerId;
  }

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Subscription filter
  if (subscriptionId) {
    query.subscriptionId = subscriptionId;
  }

  // Date range filter (issueDate)
  if (startDate || endDate) {
    query.issueDate = {};
    if (startDate) query.issueDate.$gte = new Date(startDate);
    if (endDate) query.issueDate.$lte = new Date(endDate);
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    query.grandTotal = {};
    if (minAmount) query.grandTotal.$gte = Number(minAmount);
    if (maxAmount) query.grandTotal.$lte = Number(maxAmount);
  }

  // Text search (invoiceNumber, customer name, customer email)
  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { invoiceNumber: { $regex: term, $options: 'i' } },
      { 'customerSnapshot.name': { $regex: term, $options: 'i' } },
      { 'customerSnapshot.email': { $regex: term, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const validSortFields = ['createdAt', 'issueDate', 'dueDate', 'grandTotal', 'invoiceNumber', 'status'];
  const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(query)
      .sort({ [actualSortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Invoice.countDocuments(query)
  ]);

  // Dynamically evaluate overdue status without mutating historical issued snapshots
  const mapped = invoices.map(inv => {
    const effective = evaluateEffectiveStatus(inv);
    return {
      ...inv,
      effectiveStatus: effective
    };
  });

  return {
    invoices: mapped,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    }
  };
};

/**
 * Retrieve single invoice details by ID with access control verification
 */
const getInvoiceById = async (invoiceId, user = null) => {
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) {
    return null;
  }

  // Ownership verification for customers
  if (user && user.role === 'customer' && invoice.customerId !== user.id) {
    const err = new Error('Access denied: You can only access your own invoices');
    err.statusCode = 403;
    throw err;
  }

  // Fetch payment summary from M11 adapter
  const paymentSummary = await paymentAdapter.getInvoicePaymentSummary(invoice._id);
  const auditLogs = await InvoiceAuditLog.find({ invoiceId: invoice._id })
    .sort({ performedAt: -1 })
    .lean();

  return {
    ...invoice,
    effectiveStatus: evaluateEffectiveStatus(invoice),
    paymentSummary,
    auditLogs
  };
};

/**
 * Printable invoice representation
 */
const getInvoicePrintData = async (invoiceId, user = null) => {
  const invoice = await getInvoiceById(invoiceId, user);
  if (!invoice) return null;

  return {
    invoice,
    printedAt: new Date().toISOString()
  };
};

/**
 * Financial and operational summary for M12 Analytics integration
 */
const getAnalyticsSummary = async () => {
  const allInvoices = await Invoice.find().lean();
  let totalInvoices = allInvoices.length;
  let totalBilled = 0;
  let totalTaxCollected = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  const statusCounts = {
    draft: 0,
    issued: 0,
    partially_paid: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0
  };

  allInvoices.forEach(inv => {
    const eff = evaluateEffectiveStatus(inv);
    statusCounts[eff] = (statusCounts[eff] || 0) + 1;

    if (inv.status !== 'cancelled') {
      totalBilled += inv.grandTotal || 0;
      totalTaxCollected += inv.taxTotal || 0;
      totalPaid += inv.amountPaid || 0;
      totalOutstanding += inv.outstandingAmount || 0;
    }
  });

  return {
    totalInvoices,
    totalBilled: Math.round(totalBilled * 100) / 100,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    statusCounts
  };
};

module.exports = {
  createInvoice,
  createInvoiceFromBillingPayload,
  updateDraftInvoice,
  issueInvoice,
  cancelInvoice,
  getInvoices,
  getInvoiceById,
  getInvoicePrintData,
  getAnalyticsSummary,
  recordAuditLog
};
