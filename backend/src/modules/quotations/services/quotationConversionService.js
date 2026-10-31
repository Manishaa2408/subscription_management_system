import Quotation from "../models/Quotation.js";
import QuotationActivity from "../models/QuotationActivity.js";
import subscriptionAdapter from "../adapters/subscriptionAdapter.js";

/**
 * Service to handle conversion of Accepted Quotations into Subscriptions (M7 Integration)
 */
export const convertAcceptedQuotation = async (quotationId, userContext = {}) => {
  const quotation = await Quotation.findById(quotationId);

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  if (quotation.status !== "accepted") {
    const error = new Error(`Only quotations with status 'accepted' can be converted to subscriptions (Current status: '${quotation.status}')`);
    error.statusCode = 400;
    throw error;
  }

  if (quotation.subscriptionConversion?.status === "converted") {
    const error = new Error(`Quotation has already been converted to subscription (Subscription ID: ${quotation.subscriptionConversion.subscriptionId})`);
    error.statusCode = 409;
    throw error;
  }

  const idempotencyKey = `quotation-conversion:${quotation._id}`;

  // Update conversion request status
  quotation.subscriptionConversion = {
    status: "pending",
    subscriptionId: null,
    requestedAt: new Date(),
    convertedAt: null,
    errorMessage: null
  };
  await quotation.save();

  await QuotationActivity.create({
    quotationId: quotation._id,
    action: "conversion_requested",
    description: "Subscription conversion request submitted to M7 lifecycle engine",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff"
  });

  try {
    // Format snapshot for M7 consumption contract
    const contractSnapshot = {
      id: quotation._id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerSnapshot: quotation.customerSnapshot,
      currency: quotation.currency,
      lineItems: quotation.lineItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        planId: item.planId,
        productSnapshot: item.productSnapshot,
        variantSnapshot: item.variantSnapshot,
        planSnapshot: item.planSnapshot,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        billingFrequency: item.billingFrequency,
        billingInterval: item.billingInterval,
        discount: item.discount,
        taxRate: item.taxRate,
        lineSubtotal: item.lineSubtotal,
        lineTotal: item.lineTotal
      })),
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      taxableAmount: quotation.taxableAmount,
      totalTax: quotation.totalTax,
      grandTotal: quotation.grandTotal,
      acceptedAt: quotation.acceptedAt
    };

    const conversionResult = await subscriptionAdapter.createFromAcceptedQuotation(
      contractSnapshot,
      idempotencyKey
    );

    quotation.subscriptionConversion = {
      status: "converted",
      subscriptionId: conversionResult.subscriptionId,
      requestedAt: quotation.subscriptionConversion.requestedAt,
      convertedAt: new Date(),
      errorMessage: null
    };
    await quotation.save();

    await QuotationActivity.create({
      quotationId: quotation._id,
      action: "conversion_completed",
      description: `Successfully converted to Subscription: ${conversionResult.subscriptionId}`,
      performedBy: userContext.id || null,
      performedByRole: userContext.role || "staff",
      metadata: { subscriptionId: conversionResult.subscriptionId }
    });

    return {
      success: true,
      subscriptionId: conversionResult.subscriptionId,
      quotation
    };
  } catch (error) {
    quotation.subscriptionConversion.status = "failed";
    quotation.subscriptionConversion.errorMessage = error.message;
    await quotation.save();

    await QuotationActivity.create({
      quotationId: quotation._id,
      action: "conversion_failed",
      description: `Subscription conversion failed: ${error.message}`,
      performedBy: userContext.id || null,
      performedByRole: userContext.role || "staff"
    });

    throw error;
  }
};

export default {
  convertAcceptedQuotation
};
