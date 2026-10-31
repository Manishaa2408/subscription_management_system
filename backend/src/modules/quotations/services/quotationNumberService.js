import QuotationCounter from "../models/QuotationCounter.js";

/**
 * Concurrency-safe atomic Quotation Number Generation Service
 * Format: QUO-YYYY-XXXX (e.g., QUO-2026-0001)
 */
export const generateQuotationNumber = async () => {
  const currentYear = new Date().getFullYear();

  const counter = await QuotationCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSequence = String(counter.sequence).padStart(4, "0");
  return `QUO-${currentYear}-${paddedSequence}`;
};

export default {
  generateQuotationNumber
};
