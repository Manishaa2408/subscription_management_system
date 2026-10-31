import mongoose from "mongoose";
import Subscription from "../../subscriptions/models/Subscription.js";

/**
 * Subscription Adapter for Discount Management (M8)
 * Interfaces with Module M7 (Subscription Lifecycle Management)
 */

export const getSubscriptionById = async (subscriptionId) => {
  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return null;
  return await Subscription.findById(subscriptionId);
};

export const getSubscriptionDiscountContext = async (subscriptionId) => {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) return null;

  return {
    contextType: "subscription",
    contextId: subscription._id,
    customerId: subscription.customerId,
    currency: subscription.currency || "INR",
    totalAmount: subscription.totalAmount,
    lineItems: subscription.lineItems || []
  };
};

export default {
  getSubscriptionById,
  getSubscriptionDiscountContext
};
