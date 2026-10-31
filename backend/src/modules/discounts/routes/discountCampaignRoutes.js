import { Router } from "express";
import discountCampaignController from "../controllers/discountCampaignController.js";
import { authenticate, authorize } from "../../quotationTemplates/adapters/authAdapter.js";
import {
  validate,
  createCampaignRules,
  statusRules
} from "../validators/discountValidator.js";

const router = Router();

// All campaign endpoints require authentication
router.use(authenticate);

// List campaigns (Admin and Staff)
router.get(
  "/",
  authorize("admin", "staff"),
  discountCampaignController.getCampaigns
);

// Get campaign by ID (Admin and Staff)
router.get(
  "/:id",
  authorize("admin", "staff"),
  discountCampaignController.getCampaignById
);

// Create campaign (Admin only)
router.post(
  "/",
  authorize("admin"),
  createCampaignRules,
  validate,
  discountCampaignController.createCampaign
);

// Update campaign (Admin only)
router.put(
  "/:id",
  authorize("admin"),
  createCampaignRules,
  validate,
  discountCampaignController.updateCampaign
);

// Update campaign status (Admin only)
router.patch(
  "/:id/status",
  authorize("admin"),
  statusRules,
  validate,
  discountCampaignController.updateCampaignStatus
);

// Archive campaign (Admin only)
router.patch(
  "/:id/archive",
  authorize("admin"),
  discountCampaignController.archiveCampaign
);

export default router;
