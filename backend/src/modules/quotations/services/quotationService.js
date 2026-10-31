import mongoose from "mongoose";
import Quotation from "../models/Quotation.js";
import QuotationActivity from "../models/QuotationActivity.js";
import quotationNumberService from "./quotationNumberService.js";
import quotationCalculationService from "./quotationCalculationService.js";
import quotationExpirationService from "./quotationExpirationService.js";
import customerAdapter from "../adapters/customerAdapter.js";
import productAdapter from "../adapters/productAdapter.js";
import planAdapter from "../adapters/planAdapter.js";
import templateAdapter from "../adapters/templateAdapter.js";
import notificationAdapter from "../adapters/notificationAdapter.js";

/**
 * Quotation Management Core Business Service (M6)
 */

export const createQuotation = async (data, userContext = {}) => {
  // Validate customer
  if (!data.customerId) {
    const error = new Error("Customer selection is required");
    error.statusCode = 400;
    throw error;
  }

  const { valid, customer, message } = await customerAdapter.validateCustomer(data.customerId);
  if (!valid) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  // Generate atomic quotation number
  const quotationNumber = await quotationNumberService.generateQuotationNumber();

  // If pre-filled from an M5 template
  let initialLineItems = data.lineItems || [];
  if (data.templateId && (!initialLineItems || initialLineItems.length === 0)) {
    try {
      const template = await templateAdapter.getTemplateDetails(data.templateId);
      if (template && template.items) {
        initialLineItems = template.items.map(tItem => ({
          productId: tItem.itemType === "product" ? tItem.itemId : null,
          planId: tItem.itemType === "plan" ? tItem.itemId : null,
          variantId: tItem.variantId || null,
          productSnapshot: { name: tItem.itemName },
          variantSnapshot: tItem.variantId ? { variantId: tItem.variantId, name: tItem.itemName } : {},
          planSnapshot: tItem.itemType === "plan" ? { name: tItem.itemName, price: tItem.unitPrice } : {},
          description: tItem.description || "",
          quantity: tItem.quantity,
          unitPrice: tItem.unitPrice,
          taxRate: tItem.taxRate || 18,
          billingFrequency: tItem.itemType === "plan" ? "monthly" : "one_time",
          billingInterval: 1
        }));
      }
    } catch (tmplErr) {
      console.warn("Could not load template details:", tmplErr.message);
    }
  }

  // Calculate dates
  const quotationDate = data.quotationDate ? new Date(data.quotationDate) : new Date();
  let validUntil = data.validUntil ? new Date(data.validUntil) : null;
  if (!validUntil) {
    // Default 15 days validity
    validUntil = new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  }

  if (validUntil < quotationDate) {
    const error = new Error("Valid-until date cannot precede quotation date");
    error.statusCode = 400;
    throw error;
  }

  // Perform backend authoritative calculation
  const calculations = await quotationCalculationService.calculateQuotationTotals(
    initialLineItems,
    data.discountCode || null,
    customer
  );

  const quotation = new Quotation({
    quotationNumber,
    customerId: customer._id,
    customerSnapshot: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName,
      billingAddress: customer.billingAddress
    },
    templateId: data.templateId || null,
    quotationDate,
    validUntil,
    currency: data.currency || "INR",
    lineItems: calculations.lineItems,
    subtotal: calculations.subtotal,
    discountDetails: calculations.discountDetails,
    discountAmount: calculations.discountAmount,
    taxableAmount: calculations.taxableAmount,
    taxBreakdown: calculations.taxBreakdown,
    totalTax: calculations.totalTax,
    grandTotal: calculations.grandTotal,
    internalNotes: data.internalNotes || "",
    customerNotes: data.customerNotes || "",
    termsAndConditions: data.termsAndConditions || undefined,
    status: "draft",
    createdBy: userContext.id || null,
    updatedBy: userContext.id || null
  });

  const saved = await quotation.save();

  // Audit activity
  await QuotationActivity.create({
    quotationId: saved._id,
    action: "created",
    description: `Draft Quotation ${quotationNumber} created for customer ${customer.name}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: { grandTotal: saved.grandTotal }
  });

  return saved;
};

export const getQuotations = async (queryParams = {}, userContext = {}) => {
  const {
    search,
    status,
    customerId,
    page = 1,
    limit = 10,
    sortBy = "quotationDate",
    sortOrder = "desc"
  } = queryParams;

  const filter = {};

  // Role authorization filter: Customer can ONLY see their own quotations
  if (userContext.role === "customer") {
    // Match customer by email or customerId
    filter.$or = [
      { "customerSnapshot.email": userContext.email },
      { customerId: userContext.id }
    ];
  } else if (customerId) {
    filter.customerId = customerId;
  }

  if (status) {
    filter.status = status;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { quotationNumber: regex },
      { "customerSnapshot.name": regex },
      { "customerSnapshot.companyName": regex },
      { "customerSnapshot.email": regex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [rawQuotations, total] = await Promise.all([
    Quotation.find(filter).sort(sort).skip(skip).limit(limitNum),
    Quotation.countDocuments(filter)
  ]);

  // Check and process any sent quotations that have passed validity
  const processedQuotations = [];
  for (const q of rawQuotations) {
    const checked = await quotationExpirationService.checkAndExpireQuotation(q);
    processedQuotations.push(checked);
  }

  return {
    quotations: processedQuotations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

export const getQuotationById = async (id, userContext = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid quotation ID format");
    err.statusCode = 400;
    throw err;
  }

  let quotation = await Quotation.findById(id);
  if (!quotation) {
    const err = new Error("Quotation not found");
    err.statusCode = 404;
    throw err;
  }

  // Check customer access
  if (userContext.role === "customer") {
    const isOwner =
      quotation.customerSnapshot?.email === userContext.email ||
      quotation.customerId?.toString() === userContext.id?.toString();
    if (!isOwner) {
      const err = new Error("Access denied: You can only view your own quotations");
      err.statusCode = 403;
      throw err;
    }
  }

  // Auto-expire check
  quotation = await quotationExpirationService.checkAndExpireQuotation(quotation);
  return quotation;
};

export const updateQuotation = async (id, data, userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);

  if (quotation.status !== "draft") {
    const err = new Error(`Only draft quotations can be edited (Current status: '${quotation.status}')`);
    err.statusCode = 400;
    throw err;
  }

  if (data.validUntil) {
    const newValidUntil = new Date(data.validUntil);
    if (newValidUntil < quotation.quotationDate) {
      const err = new Error("Valid-until date cannot precede quotation date");
      err.statusCode = 400;
      throw err;
    }
    quotation.validUntil = newValidUntil;
  }

  if (data.internalNotes !== undefined) quotation.internalNotes = data.internalNotes;
  if (data.customerNotes !== undefined) quotation.customerNotes = data.customerNotes;
  if (data.termsAndConditions !== undefined) quotation.termsAndConditions = data.termsAndConditions;
  if (data.currency) quotation.currency = data.currency;

  const lineItems = data.lineItems || quotation.lineItems;
  const discountCode = data.discountCode !== undefined ? data.discountCode : quotation.discountDetails?.code;

  const calculations = await quotationCalculationService.calculateQuotationTotals(
    lineItems,
    discountCode,
    quotation.customerSnapshot
  );

  quotation.lineItems = calculations.lineItems;
  quotation.subtotal = calculations.subtotal;
  quotation.discountDetails = calculations.discountDetails;
  quotation.discountAmount = calculations.discountAmount;
  quotation.taxableAmount = calculations.taxableAmount;
  quotation.taxBreakdown = calculations.taxBreakdown;
  quotation.totalTax = calculations.totalTax;
  quotation.grandTotal = calculations.grandTotal;
  quotation.updatedBy = userContext.id || null;

  const updated = await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "updated",
    description: `Quotation details and items updated`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return updated;
};

export const addLineItem = async (quotationId, itemData, userContext = {}) => {
  const quotation = await getQuotationById(quotationId, userContext);
  if (quotation.status !== "draft") {
    const err = new Error("Line items can only be added to draft quotations");
    err.statusCode = 400;
    throw err;
  }

  const currentItems = quotation.lineItems.map(item => item.toObject());
  currentItems.push(itemData);

  const calculations = await quotationCalculationService.calculateQuotationTotals(
    currentItems,
    quotation.discountDetails?.code,
    quotation.customerSnapshot
  );

  quotation.lineItems = calculations.lineItems;
  quotation.subtotal = calculations.subtotal;
  quotation.taxableAmount = calculations.taxableAmount;
  quotation.taxBreakdown = calculations.taxBreakdown;
  quotation.totalTax = calculations.totalTax;
  quotation.grandTotal = calculations.grandTotal;
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "line_item_added",
    description: `Added line item: ${itemData.description || "Product/Plan Item"}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return quotation;
};

export const removeLineItem = async (quotationId, lineId, userContext = {}) => {
  const quotation = await getQuotationById(quotationId, userContext);
  if (quotation.status !== "draft") {
    const err = new Error("Line items can only be removed from draft quotations");
    err.statusCode = 400;
    throw err;
  }

  const remaining = quotation.lineItems.filter(item => item._id.toString() !== lineId.toString());

  const calculations = await quotationCalculationService.calculateQuotationTotals(
    remaining,
    quotation.discountDetails?.code,
    quotation.customerSnapshot
  );

  quotation.lineItems = calculations.lineItems;
  quotation.subtotal = calculations.subtotal;
  quotation.discountAmount = calculations.discountAmount;
  quotation.taxableAmount = calculations.taxableAmount;
  quotation.taxBreakdown = calculations.taxBreakdown;
  quotation.totalTax = calculations.totalTax;
  quotation.grandTotal = calculations.grandTotal;
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "line_item_removed",
    description: `Removed line item from quotation`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return quotation;
};

export const recalculateQuotation = async (id, userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);
  if (quotation.status !== "draft") {
    const err = new Error("Only draft quotations can be recalculated");
    err.statusCode = 400;
    throw err;
  }

  const calculations = await quotationCalculationService.calculateQuotationTotals(
    quotation.lineItems,
    quotation.discountDetails?.code,
    quotation.customerSnapshot
  );

  quotation.lineItems = calculations.lineItems;
  quotation.subtotal = calculations.subtotal;
  quotation.discountAmount = calculations.discountAmount;
  quotation.taxableAmount = calculations.taxableAmount;
  quotation.taxBreakdown = calculations.taxBreakdown;
  quotation.totalTax = calculations.totalTax;
  quotation.grandTotal = calculations.grandTotal;

  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "recalculated",
    description: "Quotation totals authoritatively recalculated",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  return quotation;
};

export const sendQuotation = async (id, userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);

  if (quotation.status !== "draft") {
    const err = new Error(`Only draft quotations can be sent (Current status: '${quotation.status}')`);
    err.statusCode = 400;
    throw err;
  }

  if (!quotation.lineItems || quotation.lineItems.length === 0) {
    const err = new Error("Quotation must have at least one valid line item before sending");
    err.statusCode = 400;
    throw err;
  }

  if (new Date() > new Date(quotation.validUntil)) {
    const err = new Error("Cannot send quotation because the valid-until date has already passed");
    err.statusCode = 400;
    throw err;
  }

  // Recalculate to lock final pricing
  const calculations = await quotationCalculationService.calculateQuotationTotals(
    quotation.lineItems,
    quotation.discountDetails?.code,
    quotation.customerSnapshot
  );

  quotation.status = "sent";
  quotation.sentAt = new Date();
  quotation.subtotal = calculations.subtotal;
  quotation.discountAmount = calculations.discountAmount;
  quotation.taxableAmount = calculations.taxableAmount;
  quotation.taxBreakdown = calculations.taxBreakdown;
  quotation.totalTax = calculations.totalTax;
  quotation.grandTotal = calculations.grandTotal;
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  // Trigger notification
  await notificationAdapter.sendQuotationEmail(quotation.customerSnapshot, quotation);

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "sent",
    description: `Quotation finalized and officially sent to customer ${quotation.customerSnapshot.name}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: { sentAt: quotation.sentAt }
  });

  return quotation;
};

export const acceptQuotation = async (id, userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);

  // Validate state
  if (quotation.status !== "sent") {
    const err = new Error(`Only quotations with status 'sent' can be accepted (Current status: '${quotation.status}')`);
    err.statusCode = 400;
    throw err;
  }

  // Validate not expired
  if (new Date() > new Date(quotation.validUntil)) {
    quotation.status = "expired";
    quotation.expiredAt = new Date();
    await quotation.save();

    const err = new Error("Quotation has expired and can no longer be accepted");
    err.statusCode = 400;
    throw err;
  }

  // If customer role, verify ownership
  if (userContext.role === "customer") {
    const isOwner =
      quotation.customerSnapshot?.email === userContext.email ||
      quotation.customerId?.toString() === userContext.id?.toString();
    if (!isOwner) {
      const err = new Error("Access denied: You can only accept your own quotations");
      err.statusCode = 403;
      throw err;
    }
  }

  quotation.status = "accepted";
  quotation.acceptedAt = new Date();
  quotation.acceptedBy = userContext.id || null;
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  await notificationAdapter.sendQuotationStatusNotification(
    quotation.customerSnapshot,
    quotation,
    "accepted"
  );

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "accepted",
    description: `Quotation formally accepted by customer (${userContext.email || "customer"})`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "customer",
    metadata: { acceptedAt: quotation.acceptedAt }
  });

  return quotation;
};

export const rejectQuotation = async (id, reason = "", userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);

  if (quotation.status !== "sent") {
    const err = new Error(`Only quotations with status 'sent' can be rejected (Current status: '${quotation.status}')`);
    err.statusCode = 400;
    throw err;
  }

  if (userContext.role === "customer") {
    const isOwner =
      quotation.customerSnapshot?.email === userContext.email ||
      quotation.customerId?.toString() === userContext.id?.toString();
    if (!isOwner) {
      const err = new Error("Access denied: You can only reject your own quotations");
      err.statusCode = 403;
      throw err;
    }
  }

  quotation.status = "rejected";
  quotation.rejectedAt = new Date();
  quotation.rejectedBy = userContext.id || null;
  quotation.rejectionReason = reason || "Customer declined proposal";
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "rejected",
    description: `Quotation rejected. Reason: ${quotation.rejectionReason}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "customer",
    metadata: { rejectionReason: quotation.rejectionReason }
  });

  return quotation;
};

export const cancelQuotation = async (id, reason = "", userContext = {}) => {
  const quotation = await getQuotationById(id, userContext);

  if (["accepted", "cancelled"].includes(quotation.status)) {
    const err = new Error(`Cannot cancel quotation in '${quotation.status}' state`);
    err.statusCode = 400;
    throw err;
  }

  quotation.status = "cancelled";
  quotation.cancelledAt = new Date();
  quotation.cancellationReason = reason || "Cancelled by sales staff";
  quotation.updatedBy = userContext.id || null;

  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "cancelled",
    description: `Quotation cancelled. Reason: ${quotation.cancellationReason}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: { cancellationReason: quotation.cancellationReason }
  });

  return quotation;
};

export const getQuotationActivity = async (quotationId) => {
  return await QuotationActivity.find({ quotationId }).sort({ createdAt: -1 });
};

export const getQuotationDashboardMetrics = async (userContext = {}) => {
  const filter = {};
  if (userContext.role === "customer") {
    filter.$or = [
      { "customerSnapshot.email": userContext.email },
      { customerId: userContext.id }
    ];
  }

  const [total, draft, sent, accepted, rejected, expired, cancelled] = await Promise.all([
    Quotation.countDocuments(filter),
    Quotation.countDocuments({ ...filter, status: "draft" }),
    Quotation.countDocuments({ ...filter, status: "sent" }),
    Quotation.countDocuments({ ...filter, status: "accepted" }),
    Quotation.countDocuments({ ...filter, status: "rejected" }),
    Quotation.countDocuments({ ...filter, status: "expired" }),
    Quotation.countDocuments({ ...filter, status: "cancelled" })
  ]);

  // Aggregate accepted revenue
  const revenueAgg = await Quotation.aggregate([
    { $match: { ...filter, status: "accepted" } },
    { $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } }
  ]);

  return {
    total,
    draft,
    sent,
    accepted,
    rejected,
    expired,
    cancelled,
    acceptedRevenue: revenueAgg[0]?.totalRevenue || 0
  };
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
  getQuotationDashboardMetrics
};
