import Subscription from "../models/Subscription.js";
import SubscriptionActivity from "../models/SubscriptionActivity.js";
import subscriptionNumberService from "./subscriptionNumberService.js";
import subscriptionBillingDateService from "./subscriptionBillingDateService.js";
import quotationAdapter from "../adapters/quotationAdapter.js";
import billingAdapter from "../adapters/billingAdapter.js";

/**
 * Service to create Subscriptions from Accepted M6 Quotations
 */
export const createSubscriptionFromQuotation = async (quotationId, userContext = {}) => {
  // Idempotency: verify no existing subscription has this quotationId
  const existingSub = await Subscription.findOne({ quotationId });
  if (existingSub) {
    return {
      subscription: existingSub,
      isDuplicate: true,
      message: `Subscription ${existingSub.subscriptionNumber} was already created from this accepted quotation`
    };
  }

  // Validate quotation through adapter
  const validation = await quotationAdapter.validateAcceptedQuotation(quotationId);
  if (!validation.valid) {
    if (validation.isAlreadyConverted) {
      const convertedSub = await Subscription.findById(validation.subscriptionId) || await Subscription.findOne({ quotationId });
      if (convertedSub) {
        return {
          subscription: convertedSub,
          isDuplicate: true,
          message: validation.message
        };
      }
    }
    const error = new Error(validation.message);
    error.statusCode = 400;
    throw error;
  }
  const quotation = validation.quotation;

  // Generate unique atomic subscription number
  const subscriptionNumber = await subscriptionNumberService.generateSubscriptionNumber();

  // Map line items from quotation snapshot
  const lineItems = quotation.lineItems.map(item => ({
    productId: item.productId,
    variantId: item.variantId,
    planId: item.planId,
    productSnapshot: item.productSnapshot,
    variantSnapshot: item.variantSnapshot,
    planSnapshot: item.planSnapshot,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    currency: quotation.currency || "INR",
    billingFrequency: item.billingFrequency || "monthly",
    billingInterval: item.billingInterval || 1,
    discountSnapshot: item.discount || quotation.discountDetails || {}
  }));

  const primaryItem = lineItems.find(i => i.planId != null) || lineItems[0] || {};
  const frequency = primaryItem.billingFrequency || "monthly";
  const interval = primaryItem.billingInterval || 1;

  const startDate = new Date();
  const dates = subscriptionBillingDateService.calculatePeriodDates(startDate, frequency, interval);

  const subscription = new Subscription({
    subscriptionNumber,
    customerId: quotation.customerId,
    customerSnapshot: quotation.customerSnapshot,
    quotationId: quotation._id,
    lineItems,
    currency: quotation.currency || "INR",
    status: "active", // Accepted proposals activate on conversion
    startDate,
    endDate: null, // Open-ended recurring until cancelled
    trialEnabled: false,
    currentPeriodStart: dates.periodStart,
    currentPeriodEnd: dates.periodEnd,
    nextBillingDate: dates.nextBillingDate,
    lastRenewalDate: startDate,
    totalAmount: quotation.grandTotal,
    billingIntegration: {
      status: "pending",
      externalScheduleId: null,
      lastSyncAt: null,
      lastError: null
    },
    createdBy: userContext.id || null,
    updatedBy: userContext.id || null
  });

  const saved = await subscription.save();

  // Register schedule with M9 Billing Engine
  try {
    const regResult = await billingAdapter.registerSubscription(saved);
    saved.billingIntegration = {
      status: regResult.status || "registered",
      externalScheduleId: regResult.externalScheduleId,
      lastSyncAt: regResult.lastSyncAt,
      lastError: null
    };
    await saved.save();
  } catch (m9Err) {
    console.warn("[M7] M9 Billing Engine registration warning:", m9Err.message);
    saved.billingIntegration.status = "failed";
    saved.billingIntegration.lastError = m9Err.message;
    await saved.save();
  }

  // Mark M6 quotation as converted
  await quotationAdapter.markQuotationConverted(quotation._id, saved._id, userContext, saved.subscriptionNumber);

  // Record audit trail
  await SubscriptionActivity.create({
    subscriptionId: saved._id,
    action: "created",
    description: `Subscription ${subscriptionNumber} created from accepted quotation ${quotation.quotationNumber}`,
    newStatus: "active",
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "staff",
    metadata: {
      quotationNumber: quotation.quotationNumber,
      totalAmount: saved.totalAmount
    }
  });

  return {
    subscription: saved,
    isDuplicate: false,
    message: `Subscription ${subscriptionNumber} created successfully`
  };
};

export default {
  createSubscriptionFromQuotation
};
