import mongoose from "mongoose";
import QuotationTemplate from "../models/QuotationTemplate.js";
import pricingService from "./pricingService.js";
import productCatalogAdapter from "../adapters/productCatalogAdapter.js";
import planCatalogAdapter from "../adapters/planCatalogAdapter.js";

/**
 * Generate a sequential, unique template code like QT-001, QT-002...
 */
export const generateTemplateCode = async () => {
  const latest = await QuotationTemplate.findOne({}, { code: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest || !latest.code) {
    return "QT-001";
  }

  const match = latest.code.match(/QT-(\d+)/);
  if (match) {
    const nextNumber = parseInt(match[1], 10) + 1;
    return `QT-${String(nextNumber).padStart(3, "0")}`;
  }

  // Fallback timestamp code if code format is custom
  return `QT-${Date.now().toString().slice(-4)}`;
};

/**
 * Validates each item reference against catalog adapters and computes authoritative prices.
 * Changing catalog price does not alter existing templates (Price snapshotting).
 */
export const processAndSnapshotItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one line item is required");
  }

  const processedItems = [];

  for (const item of items) {
    if (!item.itemType || !["product", "plan"].includes(item.itemType)) {
      throw new Error(`Invalid itemType '${item.itemType}'. Must be 'product' or 'plan'`);
    }

    if (!item.itemId || !mongoose.Types.ObjectId.isValid(item.itemId)) {
      throw new Error(`Invalid or missing itemId: '${item.itemId}'`);
    }

    const quantity = Number(item.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error(`Quantity must be a positive number greater than 0`);
    }

    let authoritativeName = "";
    let authoritativeUnitPrice = 0;
    let authoritativeTaxRate = Number(item.taxRate) || 0;
    let variantId = item.variantId || null;

    if (item.itemType === "product") {
      const { valid, product, message } = await productCatalogAdapter.validateProduct(item.itemId);
      if (!valid) throw new Error(message);

      const priceInfo = await productCatalogAdapter.calculateVariantPrice(item.itemId, variantId);
      authoritativeUnitPrice = (item.unitPrice !== undefined && item.unitPrice !== null && Number(item.unitPrice) >= 0)
        ? Number(item.unitPrice)
        : priceInfo.finalUnitPrice;

      authoritativeName = priceInfo.variantName 
        ? `${product.name} (${priceInfo.variantName})`
        : product.name;

      if (item.taxRate === undefined || item.taxRate === null) {
        authoritativeTaxRate = priceInfo.taxRate || 0;
      }
    } else if (item.itemType === "plan") {
      const { valid, plan, message } = await planCatalogAdapter.validatePlan(item.itemId);
      if (!valid) throw new Error(message);

      const planPriceInfo = await planCatalogAdapter.getPlanPrice(item.itemId);
      authoritativeUnitPrice = (item.unitPrice !== undefined && item.unitPrice !== null && Number(item.unitPrice) >= 0)
        ? Number(item.unitPrice)
        : planPriceInfo.price;

      authoritativeName = `${plan.name} [${plan.billingInterval}]`;
      if (item.taxRate === undefined || item.taxRate === null) {
        authoritativeTaxRate = planPriceInfo.taxRate || 0;
      }
      variantId = null; // Plans do not have product variants
    }

    // Backend-authoritative price & tax calculations
    const calculations = pricingService.calculateLineItem(
      quantity,
      authoritativeUnitPrice,
      authoritativeTaxRate
    );

    processedItems.push({
      itemType: item.itemType,
      itemId: item.itemId,
      variantId,
      itemName: item.itemName || authoritativeName,
      description: item.description || "",
      ...calculations
    });
  }

  // Calculate whole template totals
  const totals = pricingService.calculateTemplateTotals(processedItems);

  return {
    items: processedItems,
    ...totals
  };
};

/**
 * Create a new Quotation Template
 */
export const createTemplate = async (templateData, userId) => {
  const code = templateData.code ? templateData.code.trim() : await generateTemplateCode();

  // Check unique code
  const existingCode = await QuotationTemplate.findOne({ code, isDeleted: false });
  if (existingCode) {
    const error = new Error(`Quotation template with code '${code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const processed = await processAndSnapshotItems(templateData.items);

  const newTemplate = new QuotationTemplate({
    name: templateData.name.trim(),
    code,
    description: templateData.description ? templateData.description.trim() : "",
    validityDays: Number(templateData.validityDays),
    status: templateData.status || "active",
    items: processed.items,
    subtotal: processed.subtotal,
    taxTotal: processed.taxTotal,
    grandTotal: processed.grandTotal,
    notes: templateData.notes ? templateData.notes.trim() : "",
    createdBy: userId || null,
    updatedBy: userId || null,
    isDeleted: false
  });

  return await newTemplate.save();
};

/**
 * Get all quotation templates with search, filter, pagination
 */
export const getAllTemplates = async (query = {}, userRole = "admin") => {
  const {
    search,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = query;

  const filter = { isDeleted: false };

  // Staff can only view active templates by default
  if (userRole === "staff") {
    filter.status = "active";
  } else if (status) {
    filter.status = status;
  }

  // Search by name or code
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { code: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [templates, total] = await Promise.all([
    QuotationTemplate.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    QuotationTemplate.countDocuments(filter)
  ]);

  return {
    templates,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id, userRole = "admin") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid template ID format");
    err.statusCode = 400;
    throw err;
  }

  const filter = { _id: id, isDeleted: false };
  if (userRole === "staff") {
    filter.status = "active";
  }

  const template = await QuotationTemplate.findOne(filter);
  if (!template) {
    const err = new Error("Quotation template not found");
    err.statusCode = 404;
    throw err;
  }

  return template;
};

/**
 * Update template by ID
 */
export const updateTemplate = async (id, updateData, userId) => {
  const template = await getTemplateById(id, "admin");

  if (updateData.name) template.name = updateData.name.trim();
  if (updateData.description !== undefined) template.description = updateData.description.trim();
  if (updateData.validityDays) template.validityDays = Number(updateData.validityDays);
  if (updateData.notes !== undefined) template.notes = updateData.notes.trim();
  if (updateData.status) template.status = updateData.status;

  if (updateData.items && Array.isArray(updateData.items)) {
    const processed = await processAndSnapshotItems(updateData.items);
    template.items = processed.items;
    template.subtotal = processed.subtotal;
    template.taxTotal = processed.taxTotal;
    template.grandTotal = processed.grandTotal;
  }

  template.updatedBy = userId || null;
  return await template.save();
};

/**
 * Update status (active / inactive)
 */
export const updateTemplateStatus = async (id, status, userId) => {
  if (!["active", "inactive"].includes(status)) {
    const err = new Error("Status must be either 'active' or 'inactive'");
    err.statusCode = 400;
    throw err;
  }

  const template = await getTemplateById(id, "admin");
  template.status = status;
  template.updatedBy = userId || null;
  return await template.save();
};

/**
 * Reference check hook for future M6 Quotation integration.
 * Will check if this template is referenced by any confirmed/active quotations.
 */
export const checkTemplateReferences = async (templateId) => {
  // Integration Hook: when M6 is integrated, query Quotation model:
  // const count = await Quotation.countDocuments({ templateId, isDeleted: false });
  // return count > 0;
  return false;
};

/**
 * Soft delete quotation template
 */
export const softDeleteTemplate = async (id, userId) => {
  const template = await getTemplateById(id, "admin");

  // Check reference hook
  const isReferenced = await checkTemplateReferences(id);
  if (isReferenced) {
    const err = new Error("Cannot delete template as it is actively referenced by existing quotations. Deactivate it instead.");
    err.statusCode = 409;
    throw err;
  }

  template.isDeleted = true;
  template.updatedBy = userId || null;
  await template.save();

  return { message: "Quotation template deleted successfully" };
};

/**
 * Format template preview data
 */
export const getTemplatePreview = async (id, userRole = "admin") => {
  const template = await getTemplateById(id, userRole);
  
  return {
    templateId: template._id,
    company: "Brightloop Software",
    name: template.name,
    code: template.code,
    description: template.description,
    validityDays: template.validityDays,
    status: template.status,
    notes: template.notes,
    items: template.items.map(item => ({
      itemType: item.itemType,
      itemId: item.itemId,
      variantId: item.variantId,
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      lineSubtotal: item.lineSubtotal,
      taxAmount: item.taxAmount,
      lineTotal: item.lineTotal
    })),
    subtotal: template.subtotal,
    taxTotal: template.taxTotal,
    grandTotal: template.grandTotal,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
};

/**
 * Contract consumption method for M6 (Quotation Management)
 */
export const getTemplateForQuotation = async (id) => {
  const template = await QuotationTemplate.findOne({ _id: id, isDeleted: false, status: "active" });
  if (!template) {
    const err = new Error("Active quotation template not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    templateId: template._id,
    name: template.name,
    code: template.code,
    description: template.description,
    validityDays: template.validityDays,
    items: template.items.map(item => ({
      itemType: item.itemType,
      itemId: item.itemId,
      variantId: item.variantId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      lineSubtotal: item.lineSubtotal,
      taxAmount: item.taxAmount,
      lineTotal: item.lineTotal
    })),
    subtotal: template.subtotal,
    taxTotal: template.taxTotal,
    grandTotal: template.grandTotal
  };
};

export default {
  generateTemplateCode,
  processAndSnapshotItems,
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  updateTemplateStatus,
  checkTemplateReferences,
  softDeleteTemplate,
  getTemplatePreview,
  getTemplateForQuotation
};
