import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import DiscountCampaign from "../models/DiscountCampaign.js";
import DiscountUsage from "../models/DiscountUsage.js";
import DiscountActivity from "../models/DiscountActivity.js";

/**
 * Main Discount Service (M8)
 * Manages discounts, rules, CRUD, and dashboard metrics.
 */

export const createDiscount = async (payload, userContext = {}) => {
  if (!payload.code) {
    const error = new Error("Discount code is required");
    error.statusCode = 400;
    throw error;
  }

  // Normalize code
  const code = payload.code.trim().toUpperCase();

  // Validate uniqueness
  const existing = await Discount.findOne({ code });
  if (existing) {
    const error = new Error(`Discount code '${code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  // Validate discount value
  const discountValue = Number(payload.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    const error = new Error("Discount value must be greater than zero");
    error.statusCode = 400;
    throw error;
  }

  if (payload.discountType === "percentage" && discountValue > 100) {
    const error = new Error("Percentage discount cannot exceed 100%");
    error.statusCode = 400;
    throw error;
  }

  // Validate dates
  if (payload.startDate && payload.endDate) {
    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      const error = new Error("End date cannot precede start date");
      error.statusCode = 400;
      throw error;
    }
  }

  // If campaignId provided, verify it exists
  if (payload.campaignId && mongoose.Types.ObjectId.isValid(payload.campaignId)) {
    const campaign = await DiscountCampaign.findById(payload.campaignId);
    if (!campaign) {
      const error = new Error(`Campaign '${payload.campaignId}' not found`);
      error.statusCode = 404;
      throw error;
    }
  }

  const discount = await Discount.create({
    ...payload,
    code,
    discountValue,
    usageCount: 0,
    createdBy: userContext.id || null,
    updatedBy: userContext.id || null
  });

  await DiscountActivity.create({
    discountId: discount._id,
    campaignId: discount.campaignId || null,
    action: "discount_created",
    description: `Created ${discount.discountType} discount '${discount.name}' (${discount.code}) for value ${discount.discountValue}${discount.discountType === "percentage" ? "%" : " " + (discount.currency || "INR")}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return discount;
};

export const getDiscounts = async (params = {}) => {
  const query = {};

  if (params.status && params.status !== "all") {
    query.status = params.status;
  }

  if (params.discountType && params.discountType !== "all") {
    query.discountType = params.discountType;
  }

  if (params.campaignId) {
    query.campaignId = params.campaignId;
  }

  if (params.applicationType && params.applicationType !== "all") {
    query.applicationType = params.applicationType;
  }

  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { code: { $regex: params.search, $options: "i" } },
      { description: { $regex: params.search, $options: "i" } }
    ];
  }

  const discounts = await Discount.find(query)
    .populate("campaignId", "name campaignCode status")
    .sort({ createdAt: -1 });

  return discounts;
};

export const getDiscountById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid discount ID '${id}'`);
    error.statusCode = 400;
    throw error;
  }

  const discount = await Discount.findById(id).populate("campaignId", "name campaignCode status");
  if (!discount) {
    const error = new Error(`Discount '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return discount;
};

export const updateDiscount = async (id, payload, userContext = {}) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    const error = new Error(`Discount '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  // Prevent modifying code if already redeemed
  if (payload.code) {
    const normalizedCode = payload.code.trim().toUpperCase();
    if (normalizedCode !== discount.code) {
      if (discount.usageCount > 0) {
        const error = new Error("Cannot change discount code of an already redeemed discount");
        error.statusCode = 400;
        throw error;
      }
      const existing = await Discount.findOne({ code: normalizedCode });
      if (existing) {
        const error = new Error(`Discount code '${normalizedCode}' is already in use`);
        error.statusCode = 409;
        throw error;
      }
      discount.code = normalizedCode;
    }
  }

  if (payload.name) discount.name = payload.name;
  if (payload.description !== undefined) discount.description = payload.description;
  if (payload.campaignId !== undefined) discount.campaignId = payload.campaignId || null;
  if (payload.discountType) discount.discountType = payload.discountType;
  if (payload.discountValue != null) discount.discountValue = Number(payload.discountValue);
  if (payload.currency) discount.currency = payload.currency.toUpperCase();
  if (payload.maximumDiscount !== undefined) discount.maximumDiscount = payload.maximumDiscount;
  if (payload.minimumPurchase !== undefined) discount.minimumPurchase = Number(payload.minimumPurchase);
  if (payload.applicability) discount.applicability = { ...discount.applicability, ...payload.applicability };
  if (payload.usageLimits) discount.usageLimits = { ...discount.usageLimits, ...payload.usageLimits };
  if (payload.applicationType) discount.applicationType = payload.applicationType;
  if (payload.billingCycles != null) discount.billingCycles = Number(payload.billingCycles);
  if (payload.stacking) discount.stacking = { ...discount.stacking, ...payload.stacking };
  if (payload.startDate !== undefined) discount.startDate = payload.startDate;
  if (payload.endDate !== undefined) discount.endDate = payload.endDate;
  if (payload.status) discount.status = payload.status;
  discount.updatedBy = userContext.id || null;

  await discount.save();

  await DiscountActivity.create({
    discountId: discount._id,
    campaignId: discount.campaignId || null,
    action: "discount_updated",
    description: `Updated discount settings for '${discount.name}' (${discount.code})`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return discount;
};

export const updateDiscountStatus = async (id, status, userContext = {}) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    const error = new Error(`Discount '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  discount.status = status;
  discount.updatedBy = userContext.id || null;
  await discount.save();

  await DiscountActivity.create({
    discountId: discount._id,
    campaignId: discount.campaignId || null,
    action: `discount_status_${status}`,
    description: `Changed discount status to '${status}'`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "admin"
  });

  return discount;
};

export const archiveDiscount = async (id, userContext = {}) => {
  return await updateDiscountStatus(id, "archived", userContext);
};

export const getDashboardMetrics = async () => {
  const [
    totalDiscounts,
    activeDiscounts,
    inactiveDiscounts,
    expiredDiscounts,
    archivedDiscounts,
    totalCampaigns,
    usages
  ] = await Promise.all([
    Discount.countDocuments(),
    Discount.countDocuments({ status: "active" }),
    Discount.countDocuments({ status: "inactive" }),
    Discount.countDocuments({
      $or: [
        { status: "expired" },
        { status: "active", endDate: { $lt: new Date() } }
      ]
    }),
    Discount.countDocuments({ status: "archived" }),
    DiscountCampaign.countDocuments(),
    DiscountUsage.find({ status: "redeemed" })
  ]);

  const totalRedemptions = usages.length;
  const totalAmountSaved = usages.reduce((sum, u) => sum + (Number(u.discountAmount) || 0), 0);

  return {
    totalDiscounts,
    activeDiscounts,
    inactiveDiscounts,
    expiredDiscounts,
    archivedDiscounts,
    totalCampaigns,
    totalRedemptions,
    totalAmountSaved: Math.round(totalAmountSaved * 100) / 100
  };
};

export default {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  updateDiscountStatus,
  archiveDiscount,
  getDashboardMetrics
};
