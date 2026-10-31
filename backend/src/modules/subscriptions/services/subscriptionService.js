import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import subscriptionNumberService from "./subscriptionNumberService.js";
import subscriptionBillingDateService from "./subscriptionBillingDateService.js";
import subscriptionLifecycleService from "./subscriptionLifecycleService.js";
import subscriptionExpirationService from "./subscriptionExpirationService.js";
import customerAdapter from "../adapters/customerAdapter.js";
import planAdapter from "../adapters/planAdapter.js";
import billingAdapter from "../adapters/billingAdapter.js";
import notificationAdapter from "../adapters/notificationAdapter.js";

/**
 * Main Subscription Lifecycle Management Service (M7)
 */

export const createManualSubscription = async (data, userContext = {}) => {
  if (!data.customerId) {
    const error = new Error("Customer ID is required");
    error.statusCode = 400;
    throw error;
  }

  const { valid: custValid, customer, message: custMsg } = await customerAdapter.validateCustomer(data.customerId);
  if (!custValid) {
    const error = new Error(custMsg);
    error.statusCode = 400;
    throw error;
  }

  const subscriptionNumber = await subscriptionNumberService.generateSubscriptionNumber();

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const trialEnabled = Boolean(data.trialEnabled);
  const trialDays = Math.max(0, parseInt(data.trialDays, 10) || 14);

  let trialStartDate = null;
  let trialEndDate = null;
  let status = data.status || "pending";

  if (trialEnabled) {
    trialStartDate = startDate;
    trialEndDate = new Date(startDate.getTime() + (trialDays * 24 * 60 * 60 * 1000));
    status = "trial";
  }

  const lineItems = data.lineItems || [];
  let totalAmount = 0;
  for (const item of lineItems) {
    totalAmount += (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
  }

  const primaryItem = lineItems[0] || {};
  const frequency = primaryItem.billingFrequency || "monthly";
  const interval = primaryItem.billingInterval || 1;

  const dates = subscriptionBillingDateService.calculatePeriodDates(
    trialEnabled ? trialEndDate : startDate,
    frequency,
    interval
  );

  const subscription = new Subscription({
    subscriptionNumber,
    customerId: customer._id,
    customerSnapshot: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName,
      billingAddress: customer.billingAddress
    },
    lineItems,
    currency: data.currency || "INR",
    status,
    startDate,
    endDate: data.endDate ? new Date(data.endDate) : null,
    trialEnabled,
    trialStartDate,
    trialEndDate,
    currentPeriodStart: dates.periodStart,
    currentPeriodEnd: dates.periodEnd,
    nextBillingDate: dates.nextBillingDate,
    lastRenewalDate: startDate,
    totalAmount: Math.round(totalAmount * 100) / 100,
    createdBy: userContext.id || null,
    updatedBy: userContext.id || null
  });

  const saved = await subscription.save();

  // If created directly in active or trial status, register with M9
  if (["active", "trial"].includes(status)) {
    try {
      const regRes = await billingAdapter.registerSubscription(saved);
      saved.billingIntegration = {
        status: regRes.status,
        externalScheduleId: regRes.externalScheduleId,
        lastSyncAt: regRes.lastSyncAt
      };
      await saved.save();
    } catch (err) {
      saved.billingIntegration = { status: "failed", lastError: err.message };
      await saved.save();
    }
  }

  await SubscriptionActivity.create({
    subscriptionId: saved._id,
    action: "created",
    description: `Subscription ${subscriptionNumber} manually created for ${customer.name}`,
    newStatus: status,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: { totalAmount: saved.totalAmount }
  });

  return saved;
};

export const getSubscriptions = async (queryParams = {}, userContext = {}) => {
  const {
    search,
    status,
    customerId,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = queryParams;

  const filter = {};

  if (userContext.role === "customer") {
    filter.$or = [
      { "customerSnapshot.email": userContext.email },
      { customerId: userContext.id }
    ];
  } else if (customerId) {
    filter.customerId = customerId;
  }

  if (status) {
    filter.status = status;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { subscriptionNumber: regex },
      { "customerSnapshot.name": regex },
      { "customerSnapshot.companyName": regex },
      { "customerSnapshot.email": regex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [rawSubscriptions, total] = await Promise.all([
    Subscription.find(filter).sort(sort).skip(skip).limit(limitNum),
    Subscription.countDocuments(filter)
  ]);

  // Check and process any trial transitions or expirations
  const processed = [];
  for (const s of rawSubscriptions) {
    const checked = await subscriptionExpirationService.checkAndExpireSubscription(s);
    processed.push(checked);
  }

  return {
    subscriptions: processed,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

export const getSubscriptionById = async (id, userContext = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid subscription ID format");
    error.statusCode = 400;
    throw error;
  }

  let subscription = await Subscription.findById(id);
  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  // Customer ownership check
  if (userContext.role === "customer") {
    const isOwner =
      subscription.customerSnapshot?.email === userContext.email ||
      subscription.customerId?.toString() === userContext.id?.toString();
    if (!isOwner) {
      const error = new Error("Access denied: You can only view your own subscriptions");
      error.statusCode = 403;
      throw error;
    }
  }

  subscription = await subscriptionExpirationService.checkAndExpireSubscription(subscription);
  return subscription;
};

export const activateSubscription = async (id, userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  subscriptionLifecycleService.validateStatusTransition(subscription.status, "active");

  const prev = subscription.status;
  subscription.status = "active";
  subscription.updatedBy = userContext.id || null;

  // Initialize period dates if missing
  if (!subscription.currentPeriodStart || !subscription.nextBillingDate) {
    const primary = subscription.lineItems[0] || {};
    const dates = subscriptionBillingDateService.calculatePeriodDates(
      new Date(),
      primary.billingFrequency || "monthly",
      primary.billingInterval || 1
    );
    subscription.currentPeriodStart = dates.periodStart;
    subscription.currentPeriodEnd = dates.periodEnd;
    subscription.nextBillingDate = dates.nextBillingDate;
  }

  await subscription.save();

  // Register with M9 Billing Engine
  try {
    const regRes = await billingAdapter.registerSubscription(subscription);
    subscription.billingIntegration = {
      status: "registered",
      externalScheduleId: regRes.externalScheduleId,
      lastSyncAt: new Date(),
      lastError: null
    };
    await subscription.save();
  } catch (err) {
    subscription.billingIntegration.status = "failed";
    subscription.billingIntegration.lastError = err.message;
    await subscription.save();
  }

  await notificationAdapter.sendSubscriptionNotification(subscription.customerSnapshot, subscription, "activated");

  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: "activated",
    description: `Subscription officially activated and registered for recurring billing`,
    previousStatus: prev,
    newStatus: "active",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return subscription;
};

export const pauseSubscription = async (id, reason = "", expectedResumeDate = null, userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  subscriptionLifecycleService.validateStatusTransition(subscription.status, "paused");

  const prev = subscription.status;
  subscription.status = "paused";
  subscription.pause = {
    pausedAt: new Date(),
    reason: reason || "Customer requested temporary suspension",
    expectedResumeDate: expectedResumeDate ? new Date(expectedResumeDate) : null
  };
  subscription.updatedBy = userContext.id || null;

  await subscription.save();

  // Notify M9 to suspend billing schedule
  await billingAdapter.pauseBillingSchedule(subscription._id, reason);

  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: "paused",
    description: `Subscription paused. Reason: ${subscription.pause.reason}`,
    previousStatus: prev,
    newStatus: "paused",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return subscription;
};

export const resumeSubscription = async (id, userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  subscriptionLifecycleService.validateStatusTransition(subscription.status, "active");

  const prev = subscription.status;
  subscription.status = "active";
  subscription.pause = {
    pausedAt: null,
    reason: "",
    expectedResumeDate: null
  };

  // Recalculate next billing date from current resumption point
  const primary = subscription.lineItems[0] || {};
  const dates = subscriptionBillingDateService.calculatePeriodDates(
    new Date(),
    primary.billingFrequency || "monthly",
    primary.billingInterval || 1
  );
  subscription.currentPeriodStart = dates.periodStart;
  subscription.currentPeriodEnd = dates.periodEnd;
  subscription.nextBillingDate = dates.nextBillingDate;
  subscription.updatedBy = userContext.id || null;

  await subscription.save();

  // Reactivate M9 billing schedule
  await billingAdapter.resumeBillingSchedule(subscription._id, {
    nextBillingDate: dates.nextBillingDate
  });

  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: "resumed",
    description: `Subscription resumed from paused state. Recurring billing reactivated`,
    previousStatus: prev,
    newStatus: "active",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return subscription;
};

export const cancelSubscription = async (id, type = "immediate", reason = "", userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  subscriptionLifecycleService.validateStatusTransition(subscription.status, "cancelled");

  const now = new Date();
  const isImmediate = type === "immediate";
  const effectiveDate = isImmediate
    ? now
    : (subscription.currentPeriodEnd || now);

  const prev = subscription.status;

  if (isImmediate) {
    subscription.status = "cancelled";
  }

  subscription.cancellation = {
    requested: true,
    type: isImmediate ? "immediate" : "end_of_period",
    reason: reason || "Subscription cancelled by user",
    requestedAt: now,
    effectiveDate
  };
  subscription.updatedBy = userContext.id || null;

  await subscription.save();

  // Cancel M9 billing schedule
  await billingAdapter.cancelBillingSchedule(subscription._id, effectiveDate);

  await SubscriptionActivity.create({
    subscriptionId: subscription._id,
    action: isImmediate ? "cancelled" : "cancellation_requested",
    description: isImmediate
      ? `Subscription cancelled immediately. Reason: ${subscription.cancellation.reason}`
      : `Subscription cancellation scheduled for end-of-period on ${effectiveDate.toLocaleDateString()}. Reason: ${subscription.cancellation.reason}`,
    previousStatus: prev,
    newStatus: subscription.status,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return subscription;
};

export const retryBillingSync = async (id, userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  try {
    const regRes = await billingAdapter.registerSubscription(subscription);
    subscription.billingIntegration = {
      status: "registered",
      externalScheduleId: regRes.externalScheduleId,
      lastSyncAt: new Date(),
      lastError: null
    };
    await subscription.save();

    await SubscriptionActivity.create({
      subscriptionId: subscription._id,
      action: "billing_sync_retried",
      description: "Successfully re-synchronized billing schedule with M9 Engine",
      performedBy: userContext.id || null,
      performedByRole: userContext.role || "staff"
    });

    return { success: true, subscription };
  } catch (err) {
    subscription.billingIntegration.lastError = err.message;
    await subscription.save();
    throw err;
  }
};

export const getBillingInfo = async (id, userContext = {}) => {
  const subscription = await getSubscriptionById(id, userContext);

  return {
    subscriptionId: subscription._id,
    subscriptionNumber: subscription.subscriptionNumber,
    customerId: subscription.customerId,
    status: subscription.status,
    currency: subscription.currency,
    lineItems: subscription.lineItems,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    nextBillingDate: subscription.nextBillingDate,
    totalAmount: subscription.totalAmount
  };
};

export const getSubscriptionDashboardMetrics = async (userContext = {}) => {
  const filter = {};
  if (userContext.role === "customer") {
    filter.$or = [
      { "customerSnapshot.email": userContext.email },
      { customerId: userContext.id }
    ];
  }

  const [total, active, trial, paused, pastDue, cancelled, expired] = await Promise.all([
    Subscription.countDocuments(filter),
    Subscription.countDocuments({ ...filter, status: "active" }),
    Subscription.countDocuments({ ...filter, status: "trial" }),
    Subscription.countDocuments({ ...filter, status: "paused" }),
    Subscription.countDocuments({ ...filter, status: "past_due" }),
    Subscription.countDocuments({ ...filter, status: "cancelled" }),
    Subscription.countDocuments({ ...filter, status: "expired" })
  ]);

  // Aggregate Monthly Recurring Revenue (MRR)
  const mrrAgg = await Subscription.aggregate([
    { $match: { ...filter, status: "active" } },
    { $group: { _id: null, totalMRR: { $sum: "$totalAmount" } } }
  ]);

  return {
    total,
    active,
    trial,
    paused,
    pastDue,
    cancelled,
    expired,
    monthlyRecurringRevenue: mrrAgg[0]?.totalMRR || 0
  };
};

export default {
  createManualSubscription,
  getSubscriptions,
  getSubscriptionById,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  retryBillingSync,
  getBillingInfo,
  getSubscriptionDashboardMetrics
};
