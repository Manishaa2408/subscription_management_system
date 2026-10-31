import mongoose from "mongoose";
import Quotation from "../../quotations/models/Quotation.js";
import QuotationActivity from "../../quotations/models/QuotationActivity.js";

/**
 * Quotation Adapter for Subscription Lifecycle Management (M7)
 * Integrates with Module M6 (Quotation Management)
 */

export const getQuotationById = async (quotationId) => {
  if (!mongoose.Types.ObjectId.isValid(quotationId)) return null;
  return await Quotation.findById(quotationId);
};

export const validateAcceptedQuotation = async (quotationId) => {
  const quotation = await getQuotationById(quotationId);

  if (!quotation) {
    return { valid: false, message: `Quotation '${quotationId}' not found` };
  }

  if (quotation.status !== "accepted") {
    return {
      valid: false,
      message: `Only accepted quotations can be converted to subscriptions. (Current status: '${quotation.status}')`
    };
  }

  if (quotation.subscriptionConversion?.status === "converted") {
    return {
      valid: false,
      isAlreadyConverted: true,
      subscriptionId: quotation.subscriptionConversion.subscriptionId,
      message: `Quotation ${quotation.quotationNumber} has already been converted to subscription '${quotation.subscriptionConversion.subscriptionId}'`
    };
  }

  if (!quotation.lineItems || quotation.lineItems.length === 0) {
    return { valid: false, message: "Quotation has no line items" };
  }

  return { valid: true, quotation };
};

export const markQuotationConverted = async (quotationId, subscriptionId, userContext = {}, subscriptionNumber = "") => {
  const quotation = await Quotation.findById(quotationId);
  if (!quotation) return null;

  quotation.subscriptionConversion = {
    status: "converted",
    subscriptionId,
    requestedAt: quotation.subscriptionConversion?.requestedAt || new Date(),
    convertedAt: new Date(),
    errorMessage: null
  };
  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "conversion_completed",
    description: `Subscription ${subscriptionNumber || subscriptionId} created from this accepted proposal`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: { subscriptionId, subscriptionNumber }
  });

  return quotation;
};

export const getAcceptedQuotations = async () => {
  return await Quotation.find({
    status: "accepted",
    "subscriptionConversion.status": { $ne: "converted" }
  }).sort({ acceptedAt: -1, createdAt: -1 });
};

export default {
  getQuotationById,
  validateAcceptedQuotation,
  markQuotationConverted,
  getAcceptedQuotations
};
