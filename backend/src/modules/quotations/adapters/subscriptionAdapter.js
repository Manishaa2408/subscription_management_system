import mongoose from "mongoose";

/**
 * Subscription Adapter for Quotation Management (M6)
 * Simulates conversion contract interface with Module M7 (Subscription Lifecycle Management)
 */

// In-memory idempotency registry to prevent duplicate conversions
const convertedRegistry = new Map();

export const createFromAcceptedQuotation = async (quotationSnapshot, idempotencyKey) => {
  if (!quotationSnapshot) {
    throw new Error("Quotation snapshot is required for conversion");
  }

  const key = idempotencyKey || `quotation-conversion:${quotationSnapshot.id || quotationSnapshot._id}`;

  if (convertedRegistry.has(key)) {
    const existing = convertedRegistry.get(key);
    return {
      success: true,
      isDuplicate: true,
      subscriptionId: existing.subscriptionId,
      message: "Subscription was already created from this accepted quotation"
    };
  }

  // Simulate M7 generating a subscription ID
  const subscriptionId = new mongoose.Types.ObjectId();

  const record = {
    subscriptionId,
    quotationNumber: quotationSnapshot.quotationNumber,
    customerId: quotationSnapshot.customerId,
    convertedAt: new Date(),
    status: "confirmed"
  };

  convertedRegistry.set(key, record);

  return {
    success: true,
    isDuplicate: false,
    subscriptionId,
    status: "confirmed",
    message: "Accepted quotation successfully converted to active subscription"
  };
};

export const getSubscriptionByQuotationId = async (quotationId) => {
  const key = `quotation-conversion:${quotationId}`;
  return convertedRegistry.get(key) || null;
};

export default {
  createFromAcceptedQuotation,
  getSubscriptionByQuotationId
};
