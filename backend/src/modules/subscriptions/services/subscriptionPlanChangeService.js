import SubscriptionPlanChange from "../models/SubscriptionPlanChange.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import planAdapter from "../adapters/planAdapter.js";
import billingAdapter from "../adapters/billingAdapter.js";

/**
 * Subscription Plan Change Service (Upgrades & Downgrades) (M7)
 */
export const changeSubscriptionPlan = async (subscription, newPlanId, reason = "", userContext = {}) => {
  if (!["active", "trial"].includes(subscription.status)) {
    const error = new Error(`Plans can only be changed on active or trial subscriptions (Current: '${subscription.status}')`);
    error.statusCode = 400;
    throw error;
  }

  // Retrieve and validate new plan
  const { valid, plan: newPlan, message } = await planAdapter.validatePlanAvailability(newPlanId);
  if (!valid) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  const primaryItemIndex = subscription.lineItems.findIndex(i => i.planId != null);
  if (primaryItemIndex === -1) {
    const error = new Error("Subscription does not have a primary subscription plan line item");
    error.statusCode = 400;
    throw error;
  }

  const oldItem = subscription.lineItems[primaryItemIndex];
  const oldPrice = oldItem.unitPrice;
  const newPrice = newPlan.price;
  const priceDifference = Math.round((newPrice - oldPrice) * 100) / 100;

  const changeType = newPrice >= oldPrice ? "upgrade" : "downgrade";

  const prevSnapshot = {
    planId: oldItem.planId,
    name: oldItem.planSnapshot?.name || "Current Plan",
    price: oldPrice,
    billingFrequency: oldItem.billingFrequency || "monthly",
    billingInterval: oldItem.billingInterval || 1
  };

  const newSnapshot = {
    planId: newPlan._id,
    name: newPlan.name,
    price: newPrice,
    billingFrequency: newPlan.billingInterval || oldItem.billingFrequency || "monthly",
    billingInterval: 1
  };

  // Create audit record
  const planChangeRecord = await SubscriptionPlanChange.create({
    subscriptionId: subscription._id,
    previousPlanSnapshot: prevSnapshot,
    newPlanSnapshot: newSnapshot,
    changeType,
    effectiveDate: new Date(),
    priceDifference,
    requestedBy: userContext.id || null,
    requestedByRole: userContext.role || "staff",
    changeStatus: "applied",
    reason
  });

  // Apply change to subscription
  subscription.lineItems[primaryItemIndex].planId = newPlan._id;
  subscription.lineItems[primaryItemIndex].unitPrice = newPrice;
  subscription.lineItems[primaryItemIndex].planSnapshot = newSnapshot;
  subscription.lineItems[primaryItemIndex].description = `${newPlan.name} [${newPlan.billingInterval}]`;
  subscription.lineItems[primaryItemIndex].billingFrequency = newPlan.billingInterval || oldItem.billingFrequency;

  // Recalculate total amount
  let newTotal = 0;
  for (const item of subscription.lineItems) {
    newTotal += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }
  subscription.totalAmount = Math.round(newTotal * 100) / 100;
  subscription.updatedBy = userContext.id || null;

  await subscription.save();

  // Notify M9 Billing Engine
  await billingAdapter.updateBillingSchedule(subscription._id, {
    planSnapshot: newSnapshot,
    totalAmount: subscription.totalAmount,
    billingFrequency: newPlan.billingInterval
  });

  // Audit activity
  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: changeType === "upgrade" ? "plan_upgraded" : "plan_downgraded",
    description: `Subscription plan changed from '${prevSnapshot.name}' (₹${oldPrice}) to '${newSnapshot.name}' (₹${newPrice}) [${changeType.toUpperCase()}]`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: {
      changeType,
      oldPrice,
      newPrice,
      priceDifference
    }
  });

  return {
    subscription,
    planChange: planChangeRecord
  };
};

export const getSubscriptionPlanChanges = async (subscriptionId) => {
  return await SubscriptionPlanChange.find({ subscriptionId }).sort({ createdAt: -1 });
};

export default {
  changeSubscriptionPlan,
  getSubscriptionPlanChanges
};
