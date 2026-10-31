import discountService from "../services/discountService.js";
import discountValidationService from "../services/discountValidationService.js";
import discountUsageService from "../services/discountUsageService.js";
import discountCampaignService from "../services/discountCampaignService.js";
import customerAdapter from "../adapters/customerAdapter.js";
import productAdapter from "../adapters/productAdapter.js";
import planAdapter from "../adapters/planAdapter.js";
import Discount from "../models/Discount.js";

/**
 * Main Discount Controller (M8)
 */

export const createDiscount = async (req, res, next) => {
  try {
    const discount = await discountService.createDiscount(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Discount '${discount.code}' created successfully`,
      data: { discount }
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscounts = async (req, res, next) => {
  try {
    const discounts = await discountService.getDiscounts(req.query);
    return res.status(200).json({
      success: true,
      message: "Discounts retrieved successfully",
      data: { discounts }
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountById = async (req, res, next) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Discount details retrieved successfully",
      data: { discount }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiscount = async (req, res, next) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: `Discount '${discount.code}' updated successfully`,
      data: { discount }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiscountStatus = async (req, res, next) => {
  try {
    const discount = await discountService.updateDiscountStatus(req.params.id, req.body.status, req.user);
    return res.status(200).json({
      success: true,
      message: `Discount status updated to '${discount.status}'`,
      data: { discount }
    });
  } catch (error) {
    next(error);
  }
};

export const archiveDiscount = async (req, res, next) => {
  try {
    const discount = await discountService.archiveDiscount(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Discount '${discount.code}' archived`,
      data: { discount }
    });
  } catch (error) {
    next(error);
  }
};

export const validateDiscount = async (req, res, next) => {
  try {
    const result = await discountValidationService.validateDiscount(req.body.code, {
      ...req.body,
      userContext: req.user
    });
    return res.status(200).json({
      success: result.valid,
      message: result.message,
      reasonCode: result.reasonCode,
      data: result.data || null
    });
  } catch (error) {
    next(error);
  }
};

export const calculateDiscount = async (req, res, next) => {
  try {
    const target = req.body.discountId || req.body.code;
    const result = await discountValidationService.calculateDiscount(target, req.body);
    return res.status(200).json({
      success: true,
      message: "Discount calculation completed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const reserveDiscountUsage = async (req, res, next) => {
  try {
    const result = await discountUsageService.reserveDiscountUsage(req.body.discountId, {
      ...req.body,
      userContext: req.user
    });
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { usage: result.usage, isExisting: result.isExisting }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmDiscountRedemption = async (req, res, next) => {
  try {
    const result = await discountUsageService.confirmDiscountRedemption(req.params.id, {
      ...req.body,
      userContext: req.user
    });
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { usage: result.usage, isDuplicate: result.isDuplicate }
    });
  } catch (error) {
    next(error);
  }
};

export const releaseDiscountReservation = async (req, res, next) => {
  try {
    const result = await discountUsageService.releaseDiscountReservation(
      req.params.id,
      req.body.reason,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { usage: result.usage }
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountUsageHistory = async (req, res, next) => {
  try {
    const usage = await discountUsageService.getDiscountUsageHistory(req.params.id, req.query);
    return res.status(200).json({
      success: true,
      message: "Discount usage history retrieved",
      data: { usage }
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountActivityHistory = async (req, res, next) => {
  try {
    const activity = await discountUsageService.getDiscountActivityHistory(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Discount activity history retrieved",
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await discountService.getDashboardMetrics();
    return res.status(200).json({
      success: true,
      message: "Discount dashboard metrics retrieved",
      data: { metrics }
    });
  } catch (error) {
    next(error);
  }
};

export const getCatalogData = async (req, res, next) => {
  try {
    const [customers, products, plans, campaigns] = await Promise.all([
      customerAdapter.getAllCustomers(),
      productAdapter.getAllProducts(),
      planAdapter.getAllPlans(),
      discountCampaignService.getCampaigns({ status: "active" })
    ]);
    return res.status(200).json({
      success: true,
      message: "Discount catalog data retrieved",
      data: { customers, products, plans, campaigns }
    });
  } catch (error) {
    next(error);
  }
};

export const getEligibleDiscounts = async (req, res, next) => {
  try {
    // Returns active discounts available for customers / staff
    const discounts = await Discount.find({
      status: "active",
      $or: [{ endDate: null }, { endDate: { $gte: new Date() } }]
    }).select("name code discountType discountValue currency minimumPurchase maximumDiscount description applicationType billingCycles");

    return res.status(200).json({
      success: true,
      message: "Eligible discounts retrieved",
      data: { discounts }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  updateDiscountStatus,
  archiveDiscount,
  validateDiscount,
  calculateDiscount,
  reserveDiscountUsage,
  confirmDiscountRedemption,
  releaseDiscountReservation,
  getDiscountUsageHistory,
  getDiscountActivityHistory,
  getDashboardMetrics,
  getCatalogData,
  getEligibleDiscounts
};
