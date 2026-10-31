import Quotation from "../models/Quotation.js";
import QuotationActivity from "../models/QuotationActivity.js";

/**
 * Service to check and process quotation expirations
 */
export const checkAndExpireQuotation = async (quotation) => {
  if (!quotation) return null;

  if (quotation.status === "sent" && new Date() > new Date(quotation.validUntil)) {
    quotation.status = "expired";
    quotation.expiredAt = new Date();
    await quotation.save();

    await QuotationActivity.create({
      quotationId: quotation._id,
      action: "expired",
      description: `Quotation automatically expired on ${quotation.expiredAt.toISOString()}`,
      performedByRole: "system"
    });
  }

  return quotation;
};

export const processAllExpiredQuotations = async () => {
  const now = new Date();
  const expiredList = await Quotation.find({
    status: "sent",
    validUntil: { $lt: now }
  });

  let count = 0;
  for (const q of expiredList) {
    q.status = "expired";
    q.expiredAt = now;
    await q.save();

    await QuotationActivity.create({
      quotationId: q._id,
      action: "expired",
      description: `Quotation validity period ended without customer acceptance`,
      performedByRole: "system"
    });
    count++;
  }

  return count;
};

export default {
  checkAndExpireQuotation,
  processAllExpiredQuotations
};
