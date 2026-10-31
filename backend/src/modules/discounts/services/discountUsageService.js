import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import DiscountUsage from "../models/DiscountUsage.js";
import DiscountActivity from "../models/DiscountActivity.js";
import discountEligibilityService from "./discountEligibilityService.js";
import discountCalculationService from "./discountCalculationService.js";

/**
 * Discount Usage & Reservation Service (M8)
 * Implements safe multi-phase lifecycle:
 * Reservation -> Confirmation (Redemption) -> Release
 * Uses idempotency keys to prevent duplicate consumption.
 */

export const reserveDiscountUsage = async (discountId, context = {}) => {
  const discount = await Discount.findById(discountId);
  if (!discount) {
    const error = new Error(`Discount '${discountId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const customerId = context.customerId || null;
  if (!customerId) {
    const error = new Error("Customer ID is required to reserve discount usage");
    error.statusCode = 400;
    throw error;
  }

  // Idempotency check: if a reservation with this key already exists
  const idempotencyKey =
    context.idempotencyKey ||
    `discount:${discount._id}:${context.contextType || "manual"}:${context.contextId || customerId}`;

  const existingUsage = await DiscountUsage.findOne({ idempotencyKey });
  if (existingUsage) {
    if (existingUsage.status === "reserved" || existingUsage.status === "redeemed") {
      return {
        usage: existingUsage,
        isExisting: true,
        message: `Reservation already active for key '${idempotencyKey}'`
      };
    }
  }

  // Re-verify eligibility atomically
  const eligibility = await discountEligibilityService.checkEligibility(discount, context);
  if (!eligibility.eligible) {
    const error = new Error(eligibility.message);
    error.statusCode = 400;
    error.reasonCode = eligibility.reasonCode;
    throw error;
  }

  // Calculate discount amount
  const calculation = discountCalculationService.calculateDiscountAmount(
    discount,
    eligibility.eligibleAmount
  );

  // Reserve capacity: 30 minutes expiration
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const usage = await DiscountUsage.create({
    discountId: discount._id,
    customerId,
    contextType: context.contextType || "quotation",
    contextId: context.contextId || null,
    idempotencyKey,
    discountAmount: calculation.finalDiscount,
    currency: discount.currency || "INR",
    status: "reserved",
    reservedAt: new Date(),
    expiresAt,
    metadata: {
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      eligibleAmount: calculation.eligibleAmount,
      lineItemsCount: context.lineItems?.length || 0
    }
  });

  // Record audit log
  await DiscountActivity.create({
    discountId: discount._id,
    campaignId: discount.campaignId || null,
    action: "usage_reserved",
    description: `Reserved ₹${calculation.finalDiscount} discount on code ${discount.code} for customer ${customerId}`,
    performedBy: context.userContext?.id || null,
    performedByRole: context.userContext?.role || "system",
    metadata: {
      reservationId: usage._id,
      idempotencyKey,
      discountAmount: calculation.finalDiscount
    }
  });

  return {
    usage,
    isExisting: false,
    message: "Discount usage reserved successfully"
  };
};

export const confirmDiscountRedemption = async (discountId, params = {}) => {
  const discount = await Discount.findById(discountId);
  if (!discount) {
    const error = new Error(`Discount '${discountId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const {
    reservationId,
    idempotencyKey,
    customerId,
    contextType = "quotation",
    contextId = null,
    discountAmount = null,
    userContext = {}
  } = params;

  let usage = null;

  // 1. Try finding by reservationId
  if (reservationId && mongoose.Types.ObjectId.isValid(reservationId)) {
    usage = await DiscountUsage.findById(reservationId);
  }

  // 2. Try finding by idempotencyKey
  if (!usage && idempotencyKey) {
    usage = await DiscountUsage.findOne({ idempotencyKey });
  }

  // Idempotency check: If already redeemed, return it without duplicate consumption
  if (usage && usage.status === "redeemed") {
    return {
      usage,
      isDuplicate: true,
      message: `Discount redemption already confirmed for ${usage.idempotencyKey}`
    };
  }

  // If a reservation exists, advance it to redeemed
  if (usage) {
    usage.status = "redeemed";
    usage.redeemedAt = new Date();
    if (discountAmount != null) usage.discountAmount = discountAmount;
    await usage.save();
  } else {
    // If direct redemption without prior reservation
    const targetKey =
      idempotencyKey ||
      `discount:${discount._id}:${contextType}:${contextId || customerId || Date.now()}`;

    usage = await DiscountUsage.create({
      discountId: discount._id,
      customerId: customerId || discount._id, // fallback for simulation
      contextType,
      contextId,
      idempotencyKey: targetKey,
      discountAmount: discountAmount || discount.discountValue || 0,
      currency: discount.currency || "INR",
      status: "redeemed",
      reservedAt: new Date(),
      redeemedAt: new Date(),
      metadata: { code: discount.code, directRedemption: true }
    });
  }

  // Atomically increment discount usageCount by 1
  await Discount.findByIdAndUpdate(discount._id, {
    $inc: { usageCount: 1 }
  });

  // Check if total usage limit reached to log activity
  const updatedDiscount = await Discount.findById(discount._id);
  if (
    updatedDiscount.usageLimits?.maximumTotalUsage != null &&
    updatedDiscount.usageCount >= updatedDiscount.usageLimits.maximumTotalUsage
  ) {
    await DiscountActivity.create({
      discountId: discount._id,
      campaignId: discount.campaignId || null,
      action: "usage_limit_reached",
      description: `Discount ${discount.code} reached maximum total usage limit (${updatedDiscount.usageLimits.maximumTotalUsage})`,
      performedBy: userContext.id || null,
      performedByRole: userContext.role || "system"
    });
  }

  // Record audit log
  await DiscountActivity.create({
    discountId: discount._id,
    campaignId: discount.campaignId || null,
    action: "usage_redeemed",
    description: `Redeemed discount ${discount.code} for ₹${usage.discountAmount}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "system",
    metadata: {
      usageId: usage._id,
      idempotencyKey: usage.idempotencyKey,
      discountAmount: usage.discountAmount
    }
  });

  return {
    usage,
    isDuplicate: false,
    message: "Discount redemption successfully confirmed"
  };
};

export const releaseDiscountReservation = async (reservationId, reason = "Operation cancelled", userContext = {}) => {
  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    const error = new Error(`Invalid reservation ID '${reservationId}'`);
    error.statusCode = 400;
    throw error;
  }

  const usage = await DiscountUsage.findById(reservationId);
  if (!usage) {
    const error = new Error(`Discount reservation '${reservationId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  if (usage.status === "redeemed") {
    const error = new Error("Cannot release an already redeemed discount usage");
    error.statusCode = 400;
    throw error;
  }

  if (usage.status === "released") {
    return {
      usage,
      alreadyReleased: true,
      message: "Discount reservation was already released"
    };
  }

  usage.status = "released";
  usage.releasedAt = new Date();
  usage.releaseReason = reason;
  await usage.save();

  await DiscountActivity.create({
    discountId: usage.discountId,
    action: "usage_released",
    description: `Released discount reservation ${usage._id}. Reason: ${reason}`,
    performedBy: userContext.id || null,
    performedByRole: userContext.role || "system",
    metadata: { reservationId, reason }
  });

  return {
    usage,
    alreadyReleased: false,
    message: "Discount reservation released successfully"
  };
};

export const getDiscountUsageHistory = async (discountId, params = {}) => {
  const query = { discountId };
  if (params.status) query.status = params.status;
  if (params.customerId) query.customerId = params.customerId;

  return await DiscountUsage.find(query).sort({ createdAt: -1 });
};

export const getDiscountActivityHistory = async (discountId) => {
  return await DiscountActivity.find({ discountId }).sort({ createdAt: -1 });
};

export default {
  reserveDiscountUsage,
  confirmDiscountRedemption,
  releaseDiscountReservation,
  getDiscountUsageHistory,
  getDiscountActivityHistory
};
