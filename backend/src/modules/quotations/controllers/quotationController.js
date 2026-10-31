import quotationService from "../services/quotationService.js";
import quotationConversionService from "../services/quotationConversionService.js";
import customerAdapter from "../adapters/customerAdapter.js";
import discountAdapter from "../adapters/discountAdapter.js";
import { generateQuotationHTML } from "../utils/quotationPDF.js";

/**
 * Quotation Controller complying with standard API response format:
 * Success: { success: true, message: "...", data: { ... } }
 * Error:   { success: false, message: "...", errors: [ ... ] }
 */

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Quotation created successfully in draft status",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotations = async (req, res, next) => {
  try {
    const result = await quotationService.getQuotations(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotations retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation retrieved successfully",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.updateQuotation(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const addLineItem = async (req, res, next) => {
  try {
    const quotation = await quotationService.addLineItem(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Line item added to quotation",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const removeLineItem = async (req, res, next) => {
  try {
    const quotation = await quotationService.removeLineItem(req.params.id, req.params.lineId, req.user);
    return res.status(200).json({
      success: true,
      message: "Line item removed from quotation",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const recalculateQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.recalculateQuotation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation recalculated successfully",
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const sendQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.sendQuotation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} officially finalized and sent to customer`,
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const acceptQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.acceptQuotation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} accepted successfully`,
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.rejectQuotation(req.params.id, req.body.reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} rejected`,
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.cancelQuotation(req.params.id, req.body.reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} cancelled`,
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationActivity = async (req, res, next) => {
  try {
    // Check access first
    await quotationService.getQuotationById(req.params.id, req.user);
    const activity = await quotationService.getQuotationActivity(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Quotation activity trail retrieved",
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationPDF = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id, req.user);
    const html = generateQuotationHTML(quotation);
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

export const convertQuotation = async (req, res, next) => {
  try {
    const result = await quotationConversionService.convertAcceptedQuotation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation converted to subscription successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await quotationService.getQuotationDashboardMetrics(req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation metrics retrieved",
      data: { metrics }
    });
  } catch (error) {
    next(error);
  }
};

export const getCatalogCustomers = async (req, res, next) => {
  try {
    const customers = await customerAdapter.getCustomers();
    return res.status(200).json({
      success: true,
      message: "Customers retrieved",
      data: { customers }
    });
  } catch (error) {
    next(error);
  }
};

export const getCatalogDiscounts = async (req, res, next) => {
  try {
    const discounts = await discountAdapter.getAvailableDiscounts();
    return res.status(200).json({
      success: true,
      message: "Discounts retrieved",
      data: { discounts }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  addLineItem,
  removeLineItem,
  recalculateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  cancelQuotation,
  getQuotationActivity,
  getQuotationPDF,
  convertQuotation,
  getDashboardMetrics,
  getCatalogCustomers,
  getCatalogDiscounts
};
