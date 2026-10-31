import { Router } from "express";
import discountController from "../controllers/discountController.js";
import { authenticate, authorize } from "../../quotationTemplates/adapters/authAdapter.js";
import {
  validate,
  createDiscountRules,
  updateDiscountRules,
  validateDiscountRules,
  calculateDiscountRules,
  reserveUsageRules,
  redeemUsageRules,
  statusRules
} from "../validators/discountValidator.js";

const router = Router();

// All discount endpoints require authentication
router.use(authenticate);

// Public / shared utility endpoints
router.get(
  "/dashboard/metrics",
  authorize("admin", "staff"),
  discountController.getDashboardMetrics
);

router.get(
  "/catalog",
  authorize("admin", "staff"),
  discountController.getCatalogData
);

router.get(
  "/eligible",
  authorize("admin", "staff", "customer"),
  discountController.getEligibleDiscounts
);

// Validation and calculation endpoints
router.post(
  "/validate",
  authorize("admin", "staff", "customer"),
  validateDiscountRules,
  validate,
  discountController.validateDiscount
);

router.post(
  "/calculate",
  authorize("admin", "staff", "customer"),
  calculateDiscountRules,
  validate,
  discountController.calculateDiscount
);

router.post(
  "/reserve",
  authorize("admin", "staff", "customer"),
  reserveUsageRules,
  validate,
  discountController.reserveDiscountUsage
);

router.post(
  "/:id/redeem",
  authorize("admin", "staff", "customer"),
  redeemUsageRules,
  validate,
  discountController.confirmDiscountRedemption
);

router.post(
  "/:id/release",
  authorize("admin", "staff", "customer"),
  discountController.releaseDiscountReservation
);

// Discount CRUD endpoints
router.get(
  "/",
  authorize("admin", "staff"),
  discountController.getDiscounts
);

router.post(
  "/",
  authorize("admin"),
  createDiscountRules,
  validate,
  discountController.createDiscount
);

router.get(
  "/:id",
  authorize("admin", "staff"),
  discountController.getDiscountById
);

router.put(
  "/:id",
  authorize("admin"),
  updateDiscountRules,
  validate,
  discountController.updateDiscount
);

router.patch(
  "/:id/status",
  authorize("admin"),
  statusRules,
  validate,
  discountController.updateDiscountStatus
);

router.patch(
  "/:id/archive",
  authorize("admin"),
  discountController.archiveDiscount
);

router.get(
  "/:id/usage",
  authorize("admin", "staff"),
  discountController.getDiscountUsageHistory
);

router.get(
  "/:id/activity",
  authorize("admin", "staff"),
  discountController.getDiscountActivityHistory
);

export default router;
