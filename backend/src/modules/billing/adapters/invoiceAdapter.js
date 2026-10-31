/**
 * M9 Invoice Adapter
 * Standalone development adapter to decouple M9 from M10 (Invoice & Tax Management).
 * 
 * Exposes:
 *   createInvoiceFromBillingPayload(payload)
 *   getInvoiceBySourceReference(sourceReference)
 *   getInvoiceById(invoiceId)
 *   getInvoiceGenerationStatus(sourceReference)
 * 
 * Important Boundary Rule:
 *   M9 MUST NOT calculate GST or permanently store invoice totals as its own official invoice records.
 *   M9 provides clean billing period and line-item inputs to M10.
 *   M10 calculates taxes and persists the official invoice.
 *   M9 records the returned invoice reference.
 */

const mongoose = require('mongoose');

// In-memory registry of invoice requests processed by this adapter
const MOCK_INVOICE_REPOSITORY = new Map();

// Test controls for simulation
let shouldSimulateFailure = false;
let shouldSimulateTimeout = false;

const setSimulateFailure = (val) => {
  shouldSimulateFailure = Boolean(val);
};

const setSimulateTimeout = (val) => {
  shouldSimulateTimeout = Boolean(val);
};

const resetMockRepository = () => {
  MOCK_INVOICE_REPOSITORY.clear();
  shouldSimulateFailure = false;
  shouldSimulateTimeout = false;
};

/**
 * Creates an invoice from the M9 recurring billing payload
 * @param {Object} payload 
 * @returns {Promise<{ success: boolean, invoiceId: string, invoiceNumber: string, sourceReference: string }>}
 */
const createInvoiceFromBillingPayload = async (payload) => {
  if (shouldSimulateTimeout) {
    throw new Error('ETIMEDOUT: Connection to M10 Invoice Service timed out');
  }

  if (shouldSimulateFailure) {
    throw new Error('M10 Service Unavailable: Invoice generation engine failed to process payload');
  }

  const { sourceReference, idempotencyKey, customerId, subscriptionId, items, billingPeriod, currency } = payload;

  if (!sourceReference) {
    throw new Error('sourceReference is required in invoice payload');
  }

  // Idempotency check: if this sourceReference was already created in M10, return existing invoice
  const existing = await getInvoiceBySourceReference(sourceReference);
  if (existing) {
    return {
      success: true,
      invoiceId: existing.invoiceId || existing._id,
      invoiceNumber: existing.invoiceNumber,
      sourceReference,
      isExisting: true
    };
  }

  // Check if live M10 Invoice model is available in Mongoose
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const InvoiceModel = mongoose.models.Invoice;
      if (InvoiceModel) {
        // Query by source reference in real M10 collection if field exists
        const dbExisting = await InvoiceModel.findOne({ 'metadata.sourceReference': sourceReference });
        if (dbExisting) {
          return {
            success: true,
            invoiceId: dbExisting._id.toString(),
            invoiceNumber: dbExisting.invoiceNumber,
            sourceReference,
            isExisting: true
          };
        }
      }
    } catch (e) {
      // Fall through to mock adapter response
    }
  }

  // Generate mock M10 invoice response
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const mockInvoiceId = `inv_gen_${Date.now()}_${randomSuffix}`;
  const mockInvoiceNumber = `INV-2026-${randomSuffix}`;

  const mockRecord = {
    _id: mockInvoiceId,
    invoiceId: mockInvoiceId,
    invoiceNumber: mockInvoiceNumber,
    sourceReference,
    idempotencyKey,
    subscriptionId,
    customerId,
    items,
    billingPeriod,
    currency: currency || 'INR',
    status: 'draft',
    createdAt: new Date()
  };

  MOCK_INVOICE_REPOSITORY.set(sourceReference, mockRecord);

  return {
    success: true,
    invoiceId: mockInvoiceId,
    invoiceNumber: mockInvoiceNumber,
    sourceReference,
    isExisting: false
  };
};

const getInvoiceBySourceReference = async (sourceReference) => {
  if (!sourceReference) return null;

  // Check M10 in Mongo if registered
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const InvoiceModel = mongoose.models.Invoice;
      if (InvoiceModel) {
        const doc = await InvoiceModel.findOne({
          $or: [
            { 'metadata.sourceReference': sourceReference },
            { notes: { $regex: sourceReference } }
          ]
        });
        if (doc) {
          return {
            invoiceId: doc._id.toString(),
            invoiceNumber: doc.invoiceNumber,
            status: doc.status,
            totalAmount: doc.totalAmount
          };
        }
      }
    } catch (e) {}
  }

  return MOCK_INVOICE_REPOSITORY.get(sourceReference) || null;
};

const getInvoiceById = async (invoiceId) => {
  if (!invoiceId) return null;

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const InvoiceModel = mongoose.models.Invoice;
      if (InvoiceModel) {
        const doc = await InvoiceModel.findById(invoiceId);
        if (doc) return doc;
      }
    } catch (e) {}
  }

  for (const record of MOCK_INVOICE_REPOSITORY.values()) {
    if (record.invoiceId === invoiceId || record._id === invoiceId) {
      return record;
    }
  }

  return null;
};

const getInvoiceGenerationStatus = async (sourceReference) => {
  const inv = await getInvoiceBySourceReference(sourceReference);
  if (!inv) {
    return { exists: false, status: 'not_found' };
  }
  return {
    exists: true,
    status: inv.status || 'generated',
    invoiceNumber: inv.invoiceNumber,
    invoiceId: inv.invoiceId || inv._id
  };
};

module.exports = {
  createInvoiceFromBillingPayload,
  getInvoiceBySourceReference,
  getInvoiceById,
  getInvoiceGenerationStatus,
  setSimulateFailure,
  setSimulateTimeout,
  resetMockRepository
};
