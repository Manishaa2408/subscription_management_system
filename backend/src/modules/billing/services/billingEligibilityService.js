const customerAdapter = require('../adapters/customerAdapter');
const planAdapter = require('../adapters/planAdapter');
const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const BillingExecution = require('../models/BillingExecution');

/**
 * Checks if a subscription is in active state
 */
const isSubscriptionActive = (subscription) => {
  return subscription && subscription.status === 'active';
};

/**
 * Checks if subscription is within its valid date range
 */
const isSubscriptionWithinBillingPeriod = (subscription, asOfDate = new Date()) => {
  if (!subscription) return false;
  const now = new Date(asOfDate);
  if (subscription.startDate && new Date(subscription.startDate) > now) {
    return false; // Future start
  }
  if (subscription.endDate && new Date(subscription.endDate) < now) {
    return false; // Expired
  }
  return true;
};

/**
 * Checks if customer is active and eligible
 */
const isCustomerEligible = async (customerId) => {
  const result = await customerAdapter.validateCustomer(customerId);
  return result;
};

/**
 * Checks if plan is active and has valid billing frequency
 */
const isPlanEligible = async (planId) => {
  const result = await planAdapter.validatePlan(planId);
  return result;
};

/**
 * Master validation: checks subscription, plan, customer, dates, and duplicate period
 */
const validateSubscriptionEligibility = async (subscription, schedule = null, asOfDate = new Date()) => {
  if (!subscription) {
    return { eligible: false, reason: 'Subscription record is null or missing' };
  }

  // 1. Subscription active check
  if (!isSubscriptionActive(subscription)) {
    return {
      eligible: false,
      reason: `Subscription status '${subscription.status}' is not eligible for billing (requires 'active')`
    };
  }

  // 2. Date bounds check
  if (!isSubscriptionWithinBillingPeriod(subscription, asOfDate)) {
    return {
      eligible: false,
      reason: `Subscription is outside its active billing window (start: ${subscription.startDate}, end: ${subscription.endDate})`
    };
  }

  // 3. Customer validation
  const customerValidation = await isCustomerEligible(subscription.customerId);
  if (!customerValidation.valid) {
    return { eligible: false, reason: customerValidation.reason };
  }

  // 4. Plan validation
  const planValidation = await isPlanEligible(subscription.planId);
  if (!planValidation.valid) {
    return { eligible: false, reason: planValidation.reason };
  }

  // 5. Next billing date due check
  const nextDate = subscription.nextBillingDate || (schedule && schedule.nextBillingDate);
  if (!nextDate) {
    return { eligible: false, reason: 'Subscription has no scheduled next billing date' };
  }

  if (new Date(nextDate) > new Date(asOfDate)) {
    return {
      eligible: false,
      reason: `Subscription is not yet due (next billing date: ${new Date(nextDate).toISOString()})`
    };
  }

  return {
    eligible: true,
    subscription,
    customer: customerValidation.customer,
    plan: planValidation.plan
  };
};

module.exports = {
  isSubscriptionActive,
  isSubscriptionWithinBillingPeriod,
  isCustomerEligible,
  isPlanEligible,
  validateSubscriptionEligibility
};
