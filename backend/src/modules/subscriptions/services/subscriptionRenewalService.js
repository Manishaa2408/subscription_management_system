import SubscriptionRenewal from "../models/SubscriptionRenewal.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import subscriptionBillingDateService from "./subscriptionBillingDateService.js";
import billingAdapter from "../adapters/billingAdapter.js";

/**
 * Subscription Renewal Service (M7)
 * Idempotently renews subscriptions and advances billing cycles.
 */
export const renewSubscription = async (subscription, userContext = {}, options = {}) => {
  if (subscription.status !== "active") {
    const error = new Error(`Only active subscriptions can be renewed (Current status: '${subscription.status}')`);
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate renewal if subscription was already renewed for this period
  if (subscription.lastRenewalDate && subscription.currentPeriodEnd) {
    const recentRenewal = await SubscriptionRenewal.findOne({
      subscriptionId: subscription._id,
      periodEnd: { $gte: subscription.currentPeriodEnd }
    });
    if (recentRenewal && !options.force) {
      const error = new Error(`Subscription has already been renewed through ${subscription.currentPeriodEnd.toISOString()}`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Calculate next period dates from currentPeriodEnd
  const baseStart = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd.getTime() + 1000)
    : new Date();

  const primaryItem = subscription.lineItems[0] || {};
  const frequency = primaryItem.billingFrequency || "monthly";
  const interval = primaryItem.billingInterval || 1;

  const dates = subscriptionBillingDateService.calculatePeriodDates(
    baseStart,
    frequency,
    interval,
    subscription.startDate ? new Date(subscription.startDate).getUTCDate() : null
  );

  // Check last renewal count
  const lastRenewalCount = await SubscriptionRenewal.countDocuments({ subscriptionId: subscription._id });
  const renewalNumber = lastRenewalCount + 1;
  const idempotencyKey = options.idempotencyKey || `renewal:${subscription._id}:${dates.periodStart.toISOString().split("T")[0]}`;

  // Check duplicate renewal for this period
  const existingRenewal = await SubscriptionRenewal.findOne({ idempotencyKey });
  if (existingRenewal) {
    const error = new Error(`Renewal already processed for cycle starting ${dates.periodStart.toISOString()}`);
    error.statusCode = 409;
    throw error;
  }

  // Record renewal entry
  const renewalRecord = await SubscriptionRenewal.create({
    subscriptionId: subscription._id,
    periodStart: dates.periodStart,
    periodEnd: dates.periodEnd,
    nextBillingDate: dates.nextBillingDate,
    renewalNumber,
    status: "active",
    idempotencyKey
  });

  // Update subscription fields
  subscription.currentPeriodStart = dates.periodStart;
  subscription.currentPeriodEnd = dates.periodEnd;
  subscription.nextBillingDate = dates.nextBillingDate;
  subscription.lastRenewalDate = new Date();
  subscription.updatedBy = userContext.id || null;

  await subscription.save();

  // Notify M9 Billing Engine
  await billingAdapter.updateBillingSchedule(subscription._id, {
    nextBillingDate: dates.nextBillingDate,
    currentPeriodStart: dates.periodStart,
    currentPeriodEnd: dates.periodEnd
  });

  // Log activity
  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: "renewed",
    description: `Subscription successfully renewed for cycle #${renewalNumber} (${dates.periodStart.toLocaleDateString()} - ${dates.periodEnd.toLocaleDateString()})`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: {
      renewalNumber,
      nextBillingDate: dates.nextBillingDate
    }
  });

  return {
    subscription,
    renewal: renewalRecord
  };
};

export const getSubscriptionRenewals = async (subscriptionId) => {
  return await SubscriptionRenewal.find({ subscriptionId }).sort({ renewalNumber: -1 });
};

export default {
  renewSubscription,
  getSubscriptionRenewals
};
