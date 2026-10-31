import { Router } from "express";
import subscriptionController from "../controllers/subscriptionController.js";
import { authenticate, authorize } from "../../quotationTemplates/adapters/authAdapter.js";
import {
  validate,
  createManualSubscriptionRules,
  subscriptionIdParamRule,
  quotationIdParamRule,
  changePlanRules,
  pauseSubscriptionRules,
  cancelSubscriptionRules
} from "../validators/subscriptionValidator.js";

const router = Router();

// All subscription endpoints require authentication
router.use(authenticate);

// Metrics endpoint
router.get(
  "/dashboard/metrics",
  authorize("admin", "staff", "customer"),
  subscriptionController.getDashboardMetrics
);

// Catalog data (customers, plans, unconverted accepted quotations)
router.get(
  "/catalog",
  authorize("admin", "staff"),
  subscriptionController.getCatalogData
);

// List subscriptions (Admin/Staff view all, Customer views own)
router.get(
  "/",
  authorize("admin", "staff", "customer"),
  subscriptionController.getSubscriptions
);

// Create manual subscription (Admin and Staff)
router.post(
  "/",
  authorize("admin", "staff"),
  createManualSubscriptionRules,
  validate,
  subscriptionController.createManualSubscription
);

// Create subscription from accepted M6 quotation (Admin and Staff)
router.post(
  "/from-quotation/:quotationId",
  authorize("admin", "staff"),
  quotationIdParamRule,
  validate,
  subscriptionController.createFromQuotation
);

// Get single subscription details
router.get(
  "/:id",
  authorize("admin", "staff", "customer"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.getSubscriptionById
);

// Activate subscription (Admin and Staff)
router.post(
  "/:id/activate",
  authorize("admin", "staff"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.activateSubscription
);

// Renew subscription (Admin and Staff)
router.post(
  "/:id/renew",
  authorize("admin", "staff"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.renewSubscription
);

// Change subscription plan (Upgrade / Downgrade) (Admin, Staff, Customer request)
router.post(
  "/:id/change-plan",
  authorize("admin", "staff", "customer"),
  changePlanRules,
  validate,
  subscriptionController.changeSubscriptionPlan
);

// Pause subscription (Admin, Staff, Customer request)
router.post(
  "/:id/pause",
  authorize("admin", "staff", "customer"),
  pauseSubscriptionRules,
  validate,
  subscriptionController.pauseSubscription
);

// Resume subscription (Admin, Staff, Customer request)
router.post(
  "/:id/resume",
  authorize("admin", "staff", "customer"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.resumeSubscription
);

// Cancel subscription (Admin, Staff, Customer request)
router.post(
  "/:id/cancel",
  authorize("admin", "staff", "customer"),
  cancelSubscriptionRules,
  validate,
  subscriptionController.cancelSubscription
);

// Activity history
router.get(
  "/:id/activity",
  authorize("admin", "staff", "customer"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.getSubscriptionActivity
);

// Renewal history
router.get(
  "/:id/renewals",
  authorize("admin", "staff", "customer"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.getSubscriptionRenewals
);

// Plan changes history
router.get(
  "/:id/plan-changes",
  authorize("admin", "staff", "customer"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.getSubscriptionPlanChanges
);

// Retry M9 billing synchronization
router.post(
  "/:id/retry-sync",
  authorize("admin", "staff"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.retryBillingSync
);

// M9 stable billing metadata contract
router.get(
  "/:id/billing-info",
  authorize("admin", "staff"),
  subscriptionIdParamRule,
  validate,
  subscriptionController.getBillingInfo
);

export default router;
