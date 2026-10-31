import mongoose from "mongoose";
import Quotation from "../../quotations/models/Quotation.js";

/**
 * Quotation Adapter for Discount Management (M8)
 * Interfaces with Module M6 (Quotation Management)
 */

export const getQuotationById = async (quotationId) => {
  if (!mongoose.Types.ObjectId.isValid(quotationId)) return null;
  return await Quotation.findById(quotationId);
};

export const getQuotationDiscountContext = async (quotationId) => {
  const quotation = await getQuotationById(quotationId);
  if (!quotation) return null;

  return {
    contextType: "quotation",
    contextId: quotation._id,
    customerId: quotation.customerId,
    currency: quotation.currency || "INR",
    subtotal: quotation.subtotal,
    lineItems: quotation.lineItems || []
  };
};

export default {
  getQuotationById,
  getQuotationDiscountContext
};
