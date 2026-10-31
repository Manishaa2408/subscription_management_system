/**
 * M11 Temporary Billing Adapter
 * Decouples M11 from Developer 3's M9 Recurring Billing module.
 */

const getBillingReference = async (referenceId) => {
  return {
    referenceId,
    type: 'recurring_billing',
    valid: true
  };
};

const getSubscriptionReference = async (subscriptionId) => {
  return {
    subscriptionId,
    active: true
  };
};

module.exports = {
  getBillingReference,
  getSubscriptionReference
};
