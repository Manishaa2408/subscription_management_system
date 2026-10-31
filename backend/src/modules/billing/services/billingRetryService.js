const BillingExecution = require('../models/BillingExecution');
const BillingAttempt = require('../models/BillingAttempt');
const BillingLog = require('../models/BillingLog');

const MAX_RETRIES = parseInt(process.env.BILLING_MAX_RETRIES, 10) || 3;
const BASE_DELAY_MINUTES = parseInt(process.env.BILLING_RETRY_BASE_DELAY_MINUTES, 10) || 5;

/**
 * Calculates next retry timestamp using exponential backoff
 * Attempt 1: +5 mins, Attempt 2: +15 mins, Attempt 3: +60 mins
 */
const calculateNextRetryDate = (attemptNumber) => {
  const delays = [5, 15, 60, 180];
  const delayMinutes = delays[attemptNumber - 1] || BASE_DELAY_MINUTES * Math.pow(2, attemptNumber - 1);
  return new Date(Date.now() + delayMinutes * 60 * 1000);
};

/**
 * Schedules a retry for an execution if within max retry threshold
 */
const scheduleRetry = async (execution, errorMessage) => {
  const attemptNumber = execution.attemptCount;
  const isRetryable = attemptNumber < MAX_RETRIES;
  const nextRetryAt = isRetryable ? calculateNextRetryDate(attemptNumber) : null;
  const status = isRetryable ? 'retry_scheduled' : 'failed';

  execution.status = status;
  execution.errorMessage = errorMessage;
  execution.nextRetryAt = nextRetryAt;
  await execution.save();

  // Record into BillingAttempt collection
  await BillingAttempt.create({
    billingExecutionId: execution._id,
    attemptNumber,
    attemptedAt: new Date(),
    status,
    requestReference: execution.sourceReference,
    errorMessage: errorMessage || 'Execution failed',
    nextRetryAt
  });

  // Record audit log
  await BillingLog.create({
    billingRunId: execution.billingRunId,
    billingExecutionId: execution._id,
    event: isRetryable ? 'BILLING_RETRY_SCHEDULED' : 'BILLING_MAX_RETRIES_EXCEEDED',
    message: isRetryable
      ? `Execution ${execution.sourceReference} failed (attempt ${attemptNumber}/${MAX_RETRIES}). Scheduled retry at ${nextRetryAt.toISOString()}`
      : `Execution ${execution.sourceReference} permanently failed after ${attemptNumber} attempts: ${errorMessage}`,
    metadata: {
      subscriptionId: execution.subscriptionId,
      attemptNumber,
      errorMessage,
      nextRetryAt
    }
  });

  return { isRetryable, nextRetryAt };
};

/**
 * Retrieves all executions currently pending retry
 */
const getRetryableBillings = async (asOfDate = new Date()) => {
  return await BillingExecution.find({
    status: 'retry_scheduled',
    nextRetryAt: { $lte: new Date(asOfDate) }
  }).sort({ nextRetryAt: 1 });
};

module.exports = {
  MAX_RETRIES,
  calculateNextRetryDate,
  scheduleRetry,
  getRetryableBillings
};
