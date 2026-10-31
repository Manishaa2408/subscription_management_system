const BillingExecution = require('../models/BillingExecution');

/**
 * Generates deterministic idempotency key for a subscription and billing period
 * Format: {cleanSubId}_{YYYYMMDD_start}_{YYYYMMDD_end}
 */
const generateIdempotencyKey = (subscriptionId, periodStart, periodEnd) => {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const startStr = pStart.toISOString().slice(0, 10).replace(/-/g, '');
  const endStr = pEnd.toISOString().slice(0, 10).replace(/-/g, '');
  const cleanSub = String(subscriptionId).trim();

  return `IDEMP_${cleanSub}_${startStr}_${endStr}`;
};

/**
 * Checks if a billing execution already exists for this idempotency key
 */
const checkExistingBilling = async (idempotencyKey) => {
  if (!idempotencyKey) return null;
  return await BillingExecution.findOne({ idempotencyKey });
};

/**
 * Atomically reserves a billing execution in MongoDB.
 * If another concurrent job tries to bill the exact same key, MongoDB's unique index
 * prevents duplicate execution.
 * 
 * @param {Object} executionData 
 * @returns {Promise<{ reserved: boolean, execution?: Object, existing?: Object }>}
 */
const reserveBillingExecution = async (executionData) => {
  const {
    billingRunId,
    subscriptionId,
    customerId,
    planId,
    billingPeriodStart,
    billingPeriodEnd,
    billingAmount,
    currency = 'INR',
    idempotencyKey,
    sourceReference
  } = executionData;

  // First check if already successfully billed
  const existing = await BillingExecution.findOne({ idempotencyKey });
  if (existing) {
    if (existing.status === 'success') {
      return {
        reserved: false,
        reason: 'already_completed',
        existing
      };
    }
    if (existing.status === 'processing') {
      return {
        reserved: false,
        reason: 'concurrent_processing',
        existing
      };
    }
    // If failed or retry_scheduled, update and re-reserve
    existing.billingRunId = billingRunId;
    existing.status = 'processing';
    existing.lastAttemptAt = new Date();
    existing.attemptCount += 1;
    await existing.save();
    return {
      reserved: true,
      execution: existing
    };
  }

  try {
    const execution = new BillingExecution({
      billingRunId,
      subscriptionId,
      customerId,
      planId,
      billingPeriodStart,
      billingPeriodEnd,
      billingAmount,
      currency,
      idempotencyKey,
      sourceReference,
      status: 'processing',
      attemptCount: 1,
      lastAttemptAt: new Date()
    });

    await execution.save();
    return {
      reserved: true,
      execution
    };
  } catch (err) {
    // Duplicate key error code from MongoDB (11000)
    if (err.code === 11000) {
      const raceExisting = await BillingExecution.findOne({ idempotencyKey });
      return {
        reserved: false,
        reason: 'duplicate_key_collision',
        existing: raceExisting
      };
    }
    throw err;
  }
};

/**
 * Marks an execution as completed with invoice details
 */
const markBillingCompleted = async (idempotencyKey, invoiceData) => {
  return await BillingExecution.findOneAndUpdate(
    { idempotencyKey },
    {
      $set: {
        status: 'success',
        invoiceReference: invoiceData.invoiceNumber,
        invoiceId: invoiceData.invoiceId,
        errorMessage: null,
        nextRetryAt: null
      }
    },
    { new: true }
  );
};

/**
 * Marks an execution as failed or retry_scheduled
 */
const markBillingFailed = async (idempotencyKey, errorMessage, nextRetryAt = null) => {
  const status = nextRetryAt ? 'retry_scheduled' : 'failed';
  return await BillingExecution.findOneAndUpdate(
    { idempotencyKey },
    {
      $set: {
        status,
        errorMessage: errorMessage ? String(errorMessage).slice(0, 500) : 'Billing execution failed',
        nextRetryAt
      }
    },
    { new: true }
  );
};

module.exports = {
  generateIdempotencyKey,
  checkExistingBilling,
  reserveBillingExecution,
  markBillingCompleted,
  markBillingFailed
};
