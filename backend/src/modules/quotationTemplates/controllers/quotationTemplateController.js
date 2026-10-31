import quotationTemplateService from "../services/quotationTemplateService.js";
import productCatalogAdapter from "../adapters/productCatalogAdapter.js";
import planCatalogAdapter from "../adapters/planCatalogAdapter.js";

/**
 * Quotation Template Controller
 * Adheres to standard API response format:
 * Success: { success: true, message: "...", data: { ... } }
 * Error:   { success: false, message: "...", errors: [ ... ] }
 */

export const createTemplate = async (req, res, next) => {
  try {
    const template = await quotationTemplateService.createTemplate(req.body, req.user?.id);
    return res.status(201).json({
      success: true,
      message: "Quotation template created successfully",
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTemplates = async (req, res, next) => {
  try {
    const result = await quotationTemplateService.getAllTemplates(req.query, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Quotation templates retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const template = await quotationTemplateService.getTemplateById(req.params.id, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Quotation template retrieved successfully",
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await quotationTemplateService.updateTemplate(
      req.params.id,
      req.body,
      req.user?.id
    );
    return res.status(200).json({
      success: true,
      message: "Quotation template updated successfully",
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplateStatus = async (req, res, next) => {
  try {
    const template = await quotationTemplateService.updateTemplateStatus(
      req.params.id,
      req.body.status,
      req.user?.id
    );
    return res.status(200).json({
      success: true,
      message: `Quotation template status updated to ${req.body.status}`,
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const result = await quotationTemplateService.softDeleteTemplate(req.params.id, req.user?.id);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplatePreview = async (req, res, next) => {
  try {
    const preview = await quotationTemplateService.getTemplatePreview(
      req.params.id,
      req.user?.role
    );
    return res.status(200).json({
      success: true,
      message: "Quotation template preview generated successfully",
      data: { preview }
    });
  } catch (error) {
    next(error);
  }
};

// Catalog endpoints for dynamic frontend selection via adapters
export const getCatalogProducts = async (req, res, next) => {
  try {
    const products = await productCatalogAdapter.getProducts();
    return res.status(200).json({
      success: true,
      message: "Catalog products retrieved",
      data: { products }
    });
  } catch (error) {
    next(error);
  }
};

export const getCatalogPlans = async (req, res, next) => {
  try {
    const plans = await planCatalogAdapter.getPlans();
    return res.status(200).json({
      success: true,
      message: "Catalog subscription plans retrieved",
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  updateTemplateStatus,
  deleteTemplate,
  getTemplatePreview,
  getCatalogProducts,
  getCatalogPlans
};
