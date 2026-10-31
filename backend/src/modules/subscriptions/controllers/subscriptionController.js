import subscriptionService from "../services/subscriptionService.js";
import subscriptionConversionService from "../services/subscriptionConversionService.js";
import subscriptionRenewalService from "../services/subscriptionRenewalService.js";
import subscriptionPlanChangeService from "../services/subscriptionPlanChangeService.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import customerAdapter from "../adapters/customerAdapter.js";
import planAdapter from "../adapters/planAdapter.js";
import quotationAdapter from "../adapters/quotationAdapter.js";

/**
 * Subscription Controller complying with standard API response format:
 * Success: { success: true, message: "...", data: { ... } }
 * Error:   { success: false, message: "...", errors: [ ... ] }
 */

export const createManualSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.createManualSubscription(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const createFromQuotation = async (req, res, next) => {
  try {
    const result = await subscriptionConversionService.createSubscriptionFromQuotation(
      req.params.quotationId,
      req.user
    );
    return res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const result = await subscriptionService.getSubscriptions(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: "Subscriptions retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Subscription details retrieved",
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const activateSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.activateSubscription(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Subscription ${subscription.subscriptionNumber} activated successfully`,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
    const result = await subscriptionRenewalService.renewSubscription(subscription, req.user);
    return res.status(200).json({
      success: true,
      message: `Subscription renewed successfully for cycle #${result.renewal.renewalNumber}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const changeSubscriptionPlan = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
    const result = await subscriptionPlanChangeService.changeSubscriptionPlan(
      subscription,
      req.body.newPlanId,
      req.body.reason,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Subscription plan ${result.planChange.changeType} applied successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.pauseSubscription(
      req.params.id,
      req.body.reason,
      req.body.expectedResumeDate,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Subscription ${subscription.subscriptionNumber} paused`,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.resumeSubscription(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Subscription ${subscription.subscriptionNumber} resumed to active status`,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(
      req.params.id,
      req.body.type || "immediate",
      req.body.reason,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Subscription ${subscription.subscriptionNumber} cancellation processed`,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionActivity = async (req, res, next) => {
  try {
    await subscriptionService.getSubscriptionById(req.params.id, req.user);
    const activity = await SubscriptionActivity.find({ subscriptionId: req.params.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Subscription activity history retrieved",
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionRenewals = async (req, res, next) => {
  try {
    await subscriptionService.getSubscriptionById(req.params.id, req.user);
    const renewals = await subscriptionRenewalService.getSubscriptionRenewals(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Subscription renewals retrieved",
      data: { renewals }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionPlanChanges = async (req, res, next) => {
  try {
    await subscriptionService.getSubscriptionById(req.params.id, req.user);
    const planChanges = await subscriptionPlanChangeService.getSubscriptionPlanChanges(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Subscription plan changes retrieved",
      data: { planChanges }
    });
  } catch (error) {
    next(error);
  }
};

export const retryBillingSync = async (req, res, next) => {
  try {
    const result = await subscriptionService.retryBillingSync(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Billing synchronization re-triggered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getBillingInfo = async (req, res, next) => {
  try {
    const billingInfo = await subscriptionService.getBillingInfo(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Billing information retrieved for M9 engine",
      data: billingInfo
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await subscriptionService.getSubscriptionDashboardMetrics(req.user);
    return res.status(200).json({
      success: true,
      message: "Subscription dashboard metrics retrieved",
      data: { metrics }
    });
  } catch (error) {
    next(error);
  }
};

export const getCatalogData = async (req, res, next) => {
  try {
    const [customers, plans, acceptedQuotations] = await Promise.all([
      customerAdapter.getAllCustomers(),
      planAdapter.getAllPlans(),
      quotationAdapter.getAcceptedQuotations()
    ]);
    return res.status(200).json({
      success: true,
      message: "Subscription catalog data retrieved",
      data: { customers, plans, acceptedQuotations }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createManualSubscription,
  createFromQuotation,
  getSubscriptions,
  getSubscriptionById,
  activateSubscription,
  renewSubscription,
  changeSubscriptionPlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  getSubscriptionActivity,
  getSubscriptionRenewals,
  getSubscriptionPlanChanges,
  retryBillingSync,
  getBillingInfo,
  getDashboardMetrics,
  getCatalogData
};
