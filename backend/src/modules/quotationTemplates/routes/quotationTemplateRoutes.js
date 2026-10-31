import { Router } from "express";
import quotationTemplateController from "../controllers/quotationTemplateController.js";
import { authenticate, authorize } from "../adapters/authAdapter.js";
import {
  validate,
  createTemplateRules,
  updateTemplateRules,
  updateStatusRules,
  templateIdParamRule
} from "../validators/quotationTemplateValidator.js";

const router = Router();

// All quotation template endpoints require authentication
router.use(authenticate);

// Dynamic catalog endpoints (Admin and Staff can view to build/inspect items)
router.get(
  "/catalog/products",
  authorize("admin", "staff"),
  quotationTemplateController.getCatalogProducts
);

router.get(
  "/catalog/plans",
  authorize("admin", "staff"),
  quotationTemplateController.getCatalogPlans
);

// Preview template (Admin and Staff)
router.get(
  "/:id/preview",
  authorize("admin", "staff"),
  templateIdParamRule,
  validate,
  quotationTemplateController.getTemplatePreview
);

// List templates (Admin and Staff)
router.get(
  "/",
  authorize("admin", "staff"),
  quotationTemplateController.getAllTemplates
);

// Get single template details (Admin and Staff)
router.get(
  "/:id",
  authorize("admin", "staff"),
  templateIdParamRule,
  validate,
  quotationTemplateController.getTemplateById
);

// Create quotation template (Admin only)
router.post(
  "/",
  authorize("admin"),
  createTemplateRules,
  validate,
  quotationTemplateController.createTemplate
);

// Update quotation template (Admin only)
router.put(
  "/:id",
  authorize("admin"),
  updateTemplateRules,
  validate,
  quotationTemplateController.updateTemplate
);

// Update template status (Admin only)
router.patch(
  "/:id/status",
  authorize("admin"),
  updateStatusRules,
  validate,
  quotationTemplateController.updateTemplateStatus
);

// Soft delete quotation template (Admin only)
router.delete(
  "/:id",
  authorize("admin"),
  templateIdParamRule,
  validate,
  quotationTemplateController.deleteTemplate
);

export default router;
