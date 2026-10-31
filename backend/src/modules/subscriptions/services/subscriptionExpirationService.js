import Subscription from "../models/Subscription.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import billingAdapter from "../adapters/billingAdapter.js";

/**
 * Subscription Expiration & Trial Completion Service (M7)
 */

export const checkAndExpireSubscription = async (subscription) => {
  if (!subscription) return null;

  const now = new Date();

  // 1. Check if trial has ended
  if (subscription.status === "trial" && subscription.trialEndDate && now >= new Date(subscription.trialEndDate)) {
    subscription.status = "active";
    await subscription.save();

    await SubscriptionActivity.create({
      subscriptionId: subscription._id,
      action: "trial_ended",
      description: `Trial period completed. Subscription transitioned to Active recurring status`,
      previousStatus: "trial",
      newStatus: "active",
      performedByRole: "system"
    });

    // Notify M9 to activate billing schedule
    await billingAdapter.resumeBillingSchedule(subscription._id, {
      status: "active",
      trialCompleted: true
    });
  }

  // 2. Check if subscription endDate has passed
  if (["active", "trial", "paused", "past_due"].includes(subscription.status)) {
    if (subscription.endDate && now >= new Date(subscription.endDate)) {
      const prev = subscription.status;
      subscription.status = "expired";
      await subscription.save();

      await billingAdapter.cancelBillingSchedule(subscription._id, now);

      await SubscriptionActivity.create({
        subscriptionId: subscription._id,
        action: "expired",
        description: `Subscription reached configured end date (${subscription.endDate.toISOString()}). Status marked as Expired`,
        previousStatus: prev,
        newStatus: "expired",
        performedByRole: "system"
      });
    }
  }

  return subscription;
};

export const processAllExpirations = async () => {
  const now = new Date();
  const eligible = await Subscription.find({
    status: { $in: ["trial", "active", "paused", "past_due"] }
  });

  let count = 0;
  for (const sub of eligible) {
    const updated = await checkAndExpireSubscription(sub);
    if (updated.status === "expired") count++;
  }

  return count;
};

export default {
  checkAndExpireSubscription,
  processAllExpirations
};
