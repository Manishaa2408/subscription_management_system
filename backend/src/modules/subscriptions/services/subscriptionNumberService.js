import SubscriptionNumberCounter from "../models/SubscriptionNumberCounter.js";

/**
 * Concurrency-safe atomic Subscription Number Generation Service
 * Format: SUB-YYYY-XXXX (e.g., SUB-2026-0001)
 */
export const generateSubscriptionNumber = async () => {
  const currentYear = new Date().getFullYear();

  const counter = await SubscriptionNumberCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSequence = String(counter.sequence).padStart(4, "0");
  return `SUB-${currentYear}-${paddedSequence}`;
};

export default {
  generateSubscriptionNumber
};
