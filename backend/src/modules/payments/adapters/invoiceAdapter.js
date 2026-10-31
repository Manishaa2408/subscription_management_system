/**
 * M11 Temporary Invoice Adapter
 * 
 * Standalone development adapter to decouple M11 from Developer 3's M10 Invoice Management module.
 * Exposes: getInvoiceById, getInvoiceDetails, getInvoiceCustomerId, getInvoiceGrandTotal,
 *          getInvoiceStatus, getInvoiceOutstandingAmount, getInvoicePaymentSummary,
 *          updateInvoicePaymentSummary, getAllInvoices.
 * 
 * In final integration, replace this adapter with M10's actual invoice service:
 *   const invoiceService = require('../../invoices/services/invoiceService');
 */

const mongoose = require('mongoose');

// Isolated Standalone Invoices Seed for independent development and testing
const SEED_INVOICES = [
  {
    _id: 'inv_mock_001',
    id: 'inv_mock_001',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cust_001_intra_kerala',
    customerSnapshot: {
      name: 'Kochi Tech Labs Pvt Ltd',
      email: 'finance@kochitechlabs.com',
      phone: '+91 484 242 1100'
    },
    subscriptionId: 'sub_bright_starter_01',
    grandTotal: 3894,
    amountPaid: 0,
    outstandingAmount: 3894,
    currency: 'INR',
    status: 'issued',
    issueDate: new Date('2026-10-25T10:00:00Z'),
    dueDate: new Date('2026-11-09T23:59:59Z')
  },
  {
    _id: 'inv_mock_002',
    id: 'inv_mock_002',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'cust_002_inter_bengaluru',
    customerSnapshot: {
      name: 'Bengaluru Cloud Systems LLP',
      email: 'accounts@bengalurucloud.io',
      phone: '+91 80 4111 2233'
    },
    subscriptionId: 'sub_bright_pro_02',
    grandTotal: 16815,
    amountPaid: 0,
    outstandingAmount: 16815,
    currency: 'INR',
    status: 'issued',
    issueDate: new Date('2026-10-20T09:00:00Z'),
    dueDate: new Date('2026-11-04T23:59:59Z')
  },
  {
    _id: 'inv_mock_003',
    id: 'inv_mock_003',
    invoiceNumber: 'INV-2026-0003',
    customerId: 'cust_001_intra_kerala',
    customerSnapshot: {
      name: 'Kochi Tech Labs Pvt Ltd',
      email: 'finance@kochitechlabs.com',
      phone: '+91 484 242 1100'
    },
    subscriptionId: 'sub_bright_ent_03',
    grandTotal: 35400,
    amountPaid: 15000,
    outstandingAmount: 20400,
    currency: 'INR',
    status: 'partially_paid',
    issueDate: new Date('2026-10-15T08:00:00Z'),
    dueDate: new Date('2026-10-30T23:59:59Z')
  },
  {
    _id: 'inv_mock_004',
    id: 'inv_mock_004',
    invoiceNumber: 'INV-2026-0004',
    customerId: 'cust_003_inter_chennai',
    customerSnapshot: {
      name: 'Chennai Retail Solutions',
      email: 'billing@chennairetail.in',
      phone: '+91 44 2828 9000'
    },
    subscriptionId: 'sub_bright_growth_04',
    grandTotal: 45135,
    amountPaid: 45135,
    outstandingAmount: 0,
    currency: 'INR',
    status: 'paid',
    issueDate: new Date('2026-10-01T10:00:00Z'),
    dueDate: new Date('2026-10-15T23:59:59Z')
  },
  {
    _id: 'inv_mock_005',
    id: 'inv_mock_005',
    invoiceNumber: 'INV-2026-0005',
    customerId: 'cust_004_intra_consumer',
    customerSnapshot: {
      name: 'Arun Kumar (Individual Consumer)',
      email: 'arun.kerala@example.com',
      phone: '+91 98470 12345'
    },
    subscriptionId: 'sub_bright_basic_05',
    grandTotal: 1416,
    amountPaid: 0,
    outstandingAmount: 1416,
    currency: 'INR',
    status: 'overdue',
    issueDate: new Date('2026-10-05T09:00:00Z'),
    dueDate: new Date('2026-10-20T23:59:59Z')
  }
];

// Helper to check if M10's Invoice model is loaded in Mongoose
const getInvoiceModel = () => {
  try {
    return mongoose.model('Invoice');
  } catch (e) {
    return null;
  }
};

const getInvoiceById = async (invoiceId) => {
  if (!invoiceId) return null;
  const idStr = invoiceId.toString();

  // Try DB first if connected and model registered
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const InvoiceModel = getInvoiceModel();
    if (InvoiceModel) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await InvoiceModel.findById(idStr).lean();
        }
        if (!doc) {
          doc = await InvoiceModel.findOne({ invoiceNumber: idStr }).lean();
        }
        if (doc) return doc;
      } catch (err) {}
    }
  }

  // Fallback to standalone seed invoices
  return SEED_INVOICES.find(inv => inv._id === idStr || inv.id === idStr || inv.invoiceNumber === idStr) || null;
};

const getInvoiceDetails = async (invoiceId) => {
  return await getInvoiceById(invoiceId);
};

const getInvoiceCustomerId = async (invoiceId) => {
  const inv = await getInvoiceById(invoiceId);
  return inv ? inv.customerId : null;
};

const getInvoiceGrandTotal = async (invoiceId) => {
  const inv = await getInvoiceById(invoiceId);
  return inv ? inv.grandTotal : 0;
};

const getInvoiceStatus = async (invoiceId) => {
  const inv = await getInvoiceById(invoiceId);
  return inv ? inv.status : null;
};

const getInvoiceOutstandingAmount = async (invoiceId) => {
  const inv = await getInvoiceById(invoiceId);
  if (!inv) return 0;
  return inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.grandTotal - (inv.amountPaid || 0));
};

const getInvoicePaymentSummary = async (invoiceId) => {
  const inv = await getInvoiceById(invoiceId);
  if (!inv) return null;

  return {
    invoiceId: inv._id || inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerId: inv.customerId,
    grandTotal: inv.grandTotal,
    amountPaid: inv.amountPaid || 0,
    outstandingAmount: inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.grandTotal - (inv.amountPaid || 0)),
    status: inv.status
  };
};

const updateInvoicePaymentSummary = async (invoiceId, summary) => {
  if (!invoiceId) return null;
  const idStr = invoiceId.toString();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const InvoiceModel = getInvoiceModel();
    if (InvoiceModel) {
      try {
        const updateData = {};
        if (summary.totalPaid !== undefined) updateData.amountPaid = summary.totalPaid;
        if (summary.outstandingAmount !== undefined) updateData.outstandingAmount = summary.outstandingAmount;
        if (summary.paymentStatus) updateData.status = summary.paymentStatus;

        let updated = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          updated = await InvoiceModel.findByIdAndUpdate(idStr, { $set: updateData }, { new: true });
        }
        if (!updated) {
          updated = await InvoiceModel.findOneAndUpdate({ invoiceNumber: idStr }, { $set: updateData }, { new: true });
        }
        if (updated) return updated;
      } catch (err) {}
    }
  }

  // Update in seed invoices fallback
  const found = SEED_INVOICES.find(inv => inv._id === idStr || inv.id === idStr || inv.invoiceNumber === idStr);
  if (found) {
    if (summary.totalPaid !== undefined) found.amountPaid = summary.totalPaid;
    if (summary.outstandingAmount !== undefined) found.outstandingAmount = summary.outstandingAmount;
    if (summary.paymentStatus) found.status = summary.paymentStatus;
    return found;
  }

  return null;
};

const getAllInvoices = async (filters = {}) => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const InvoiceModel = getInvoiceModel();
    if (InvoiceModel) {
      try {
        const query = {};
        if (filters.customerId) query.customerId = filters.customerId;
        const docs = await InvoiceModel.find(query).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs;
      } catch (err) {}
    }
  }

  if (filters.customerId) {
    return SEED_INVOICES.filter(inv => inv.customerId === filters.customerId);
  }
  return [...SEED_INVOICES];
};

module.exports = {
  getInvoiceById,
  getInvoiceDetails,
  getInvoiceCustomerId,
  getInvoiceGrandTotal,
  getInvoiceStatus,
  getInvoiceOutstandingAmount,
  getInvoicePaymentSummary,
  updateInvoicePaymentSummary,
  getAllInvoices,
  SEED_INVOICES
};
