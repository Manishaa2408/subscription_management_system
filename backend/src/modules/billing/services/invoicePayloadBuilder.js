/**
 * M9 Invoice Payload Builder
 * Builds and validates clean, standardized invoice-generation payloads to send to M10.
 */

/**
 * Generates formatted source reference: BILL-{subId}-{YYYYMMDD}
 */
const generateSourceReference = (subscriptionId, periodStart) => {
  const d = new Date(periodStart);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const cleanSub = String(subscriptionId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `BILL-${cleanSub}-${yyyy}${mm}${dd}`;
};

/**
 * Builds the canonical M9 -> M10 invoice payload
 */
const buildInvoicePayload = ({
  subscription,
  plan,
  customer,
  billingPeriod,
  sourceReference,
  idempotencyKey
}) => {
  const quantity = subscription.quantity || 1;
  const unitPrice = plan.price;

  return {
    sourceReference: sourceReference || generateSourceReference(subscription.subscriptionId || subscription.id, billingPeriod.startDate),
    idempotencyKey: idempotencyKey,
    source: 'M9_RECURRING_BILLING',
    subscriptionId: subscription.subscriptionId || subscription.id,
    customerId: customer.customerId || customer.id,
    planId: plan.planId || plan.id,
    productId: subscription.productId || undefined,
    billingPeriod: {
      startDate: new Date(billingPeriod.startDate).toISOString(),
      endDate: new Date(billingPeriod.endDate).toISOString()
    },
    items: [
      {
        itemType: 'plan',
        itemId: plan.planId || plan.id,
        itemName: plan.name,
        description: `Recurring ${plan.billingFrequency} billing cycle (${new Date(billingPeriod.startDate).toLocaleDateString('en-IN')} to ${new Date(billingPeriod.endDate).toLocaleDateString('en-IN')})`,
        quantity,
        unitPrice
      }
    ],
    currency: plan.currency || 'INR',
    issueDate: new Date().toISOString()
  };
};

/**
 * Validates the constructed invoice payload before dispatch
 */
const validateInvoicePayload = (payload) => {
  const errors = [];
  if (!payload.sourceReference) errors.push('sourceReference is missing');
  if (!payload.idempotencyKey) errors.push('idempotencyKey is missing');
  if (!payload.subscriptionId) errors.push('subscriptionId is missing');
  if (!payload.customerId) errors.push('customerId is missing');
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('items array must not be empty');
  } else {
    payload.items.forEach((item, idx) => {
      if (!item.itemName) errors.push(`Item ${idx}: itemName is required`);
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors.push(`Item ${idx}: unitPrice must be a non-negative number`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${idx}: quantity must be at least 1`);
      }
    });
  }
  if (!payload.billingPeriod || !payload.billingPeriod.startDate || !payload.billingPeriod.endDate) {
    errors.push('billingPeriod must specify both startDate and endDate');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  generateSourceReference,
  buildInvoicePayload,
  validateInvoicePayload
};
