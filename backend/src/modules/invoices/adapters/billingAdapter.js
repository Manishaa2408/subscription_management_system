/**
 * M10 Temporary Billing Adapter
 * 
 * Standalone development adapter to decouple M10 from Developer 3's M9 Recurring Billing Engine.
 * Exposes: getGeneratedInvoiceData, validateBillingPayload, getBillingSource, receiveGeneratedInvoice,
 *          getSampleBillingPayloads.
 * 
 * In final integration, M9 will invoke M10's invoiceService.createInvoiceFromBillingPayload(payload).
 */

const SAMPLE_BILLING_PAYLOADS = [
  {
    sourceReference: 'BILL-SUB-2026-001-C1',
    subscriptionId: 'sub_bright_enterprise_001',
    customerId: 'cust_001_intra_kerala',
    billingPeriod: {
      startDate: new Date('2026-11-01T00:00:00Z'),
      endDate: new Date('2026-11-30T23:59:59Z')
    },
    issueDate: new Date('2026-11-01T09:00:00Z'),
    dueDate: new Date('2026-11-15T23:59:59Z'),
    currency: 'INR',
    notes: 'Recurring monthly billing for Brightloop Enterprise SaaS Suite.',
    items: [
      {
        itemName: 'Brightloop Enterprise SaaS Subscription (Monthly)',
        description: 'Includes up to 50 user licenses, priority support, and audit logs.',
        productId: 'prod_enterprise_saas',
        variantId: 'var_monthly_50u',
        quantity: 1,
        unitPrice: 15000,
        discountPercentage: 10,
        taxCode: 'GST18'
      },
      {
        itemName: 'Dedicated Cloud Storage Addon (500GB)',
        description: 'High-availability automated encrypted backups.',
        productId: 'addon_storage_500gb',
        quantity: 2,
        unitPrice: 2000,
        discountPercentage: 0,
        taxCode: 'GST18'
      }
    ]
  },
  {
    sourceReference: 'BILL-SUB-2026-002-C1',
    subscriptionId: 'sub_bright_pro_002',
    customerId: 'cust_002_inter_bengaluru',
    billingPeriod: {
      startDate: new Date('2026-11-01T00:00:00Z'),
      endDate: new Date('2026-11-30T23:59:59Z')
    },
    issueDate: new Date('2026-11-01T09:00:00Z'),
    dueDate: new Date('2026-11-15T23:59:59Z'),
    currency: 'INR',
    notes: 'Recurring monthly billing for Brightloop Professional (Inter-state).',
    items: [
      {
        itemName: 'Brightloop Professional SaaS Subscription (Monthly)',
        description: 'Up to 15 user seats and standard support.',
        productId: 'prod_pro_saas',
        quantity: 1,
        unitPrice: 5000,
        discountPercentage: 0,
        taxCode: 'GST18'
      }
    ]
  }
];

const validateBillingPayload = (payload) => {
  const errors = [];
  if (!payload) {
    return { valid: false, errors: ['Billing payload is missing'] };
  }
  if (!payload.sourceReference) {
    errors.push('sourceReference is required for billing payload idempotency');
  }
  if (!payload.customerId) {
    errors.push('customerId is required in billing payload');
  }
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    payload.items.forEach((item, idx) => {
      if (!item.itemName) errors.push(`Item #${idx + 1}: itemName is required`);
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item #${idx + 1}: quantity must be a positive number`);
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors.push(`Item #${idx + 1}: unitPrice must be a non-negative number`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const getGeneratedInvoiceData = async (invoiceId) => {
  return null;
};

const getBillingSource = async (subscriptionId) => {
  return {
    subscriptionId,
    billingFrequency: 'monthly',
    autoRenew: true
  };
};

const receiveGeneratedInvoice = async (payload, invoiceService) => {
  const validation = validateBillingPayload(payload);
  if (!validation.valid) {
    throw new Error(`Invalid billing payload: ${validation.errors.join(', ')}`);
  }
  return await invoiceService.createInvoiceFromBillingPayload(payload);
};

const getSampleBillingPayloads = () => {
  return JSON.parse(JSON.stringify(SAMPLE_BILLING_PAYLOADS));
};

module.exports = {
  validateBillingPayload,
  getGeneratedInvoiceData,
  getBillingSource,
  receiveGeneratedInvoice,
  getSampleBillingPayloads,
  SAMPLE_BILLING_PAYLOADS
};
