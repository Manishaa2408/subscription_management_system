import { Router } from "express";
import quotationController from "../controllers/quotationController.js";
import { authenticate, authorize } from "../../quotationTemplates/adapters/authAdapter.js";
import {
  validate,
  createQuotationRules,
  updateQuotationRules,
  addLineItemRules,
  quotationIdParamRule,
  rejectQuotationRules,
  cancelQuotationRules
} from "../validators/quotationValidator.js";

const router = Router();

// All quotation endpoints require authentication
router.use(authenticate);

// Public / Shared Catalog & Metric Endpoints
router.get(
  "/dashboard/metrics",
  authorize("admin", "staff", "customer"),
  quotationController.getDashboardMetrics
);

router.get(
  "/catalog/customers",
  authorize("admin", "staff"),
  quotationController.getCatalogCustomers
);

router.get(
  "/catalog/discounts",
  authorize("admin", "staff"),
  quotationController.getCatalogDiscounts
);

// List quotations (Admin/Staff view all, Customer views own)
router.get(
  "/",
  authorize("admin", "staff", "customer"),
  quotationController.getQuotations
);

// Create quotation (Admin and Staff only)
router.post(
  "/",
  authorize("admin", "staff"),
  createQuotationRules,
  validate,
  quotationController.createQuotation
);

// PDF printable document (Admin, Staff, Customer for own)
router.get(
  "/:id/pdf",
  authorize("admin", "staff", "customer"),
  quotationIdParamRule,
  validate,
  quotationController.getQuotationPDF
);

// Activity audit trail (Admin, Staff, Customer for own)
router.get(
  "/:id/activity",
  authorize("admin", "staff", "customer"),
  quotationIdParamRule,
  validate,
  quotationController.getQuotationActivity
);

// Get single quotation details (Admin, Staff, Customer for own)
router.get(
  "/:id",
  authorize("admin", "staff", "customer"),
  quotationIdParamRule,
  validate,
  quotationController.getQuotationById
);

// Update draft quotation (Admin and Staff)
router.put(
  "/:id",
  authorize("admin", "staff"),
  updateQuotationRules,
  validate,
  quotationController.updateQuotation
);

// Add line item (Admin and Staff)
router.post(
  "/:id/line-items",
  authorize("admin", "staff"),
  addLineItemRules,
  validate,
  quotationController.addLineItem
);

// Remove line item (Admin and Staff)
router.delete(
  "/:id/line-items/:lineId",
  authorize("admin", "staff"),
  quotationController.removeLineItem
);

// Recalculate quotation (Admin and Staff)
router.post(
  "/:id/recalculate",
  authorize("admin", "staff"),
  quotationIdParamRule,
  validate,
  quotationController.recalculateQuotation
);

// Send quotation to customer (Admin and Staff)
router.post(
  "/:id/send",
  authorize("admin", "staff"),
  quotationIdParamRule,
  validate,
  quotationController.sendQuotation
);

// Customer accept quotation (Customer only)
router.post(
  "/:id/accept",
  authorize("customer", "admin"), // Admin can also test customer accept in dev
  quotationIdParamRule,
  validate,
  quotationController.acceptQuotation
);

// Customer reject quotation (Customer only)
router.post(
  "/:id/reject",
  authorize("customer", "admin"),
  rejectQuotationRules,
  validate,
  quotationController.rejectQuotation
);

// Cancel quotation (Admin and Staff)
router.post(
  "/:id/cancel",
  authorize("admin", "staff"),
  cancelQuotationRules,
  validate,
  quotationController.cancelQuotation
);

// Convert accepted quotation to M7 subscription (Admin and Staff)
router.post(
  "/:id/convert",
  authorize("admin", "staff"),
  quotationIdParamRule,
  validate,
  quotationController.convertQuotation
);

export default router;
