const BillingRun = require('../models/BillingRun');
const BillingExecution = require('../models/BillingExecution');
const BillingAttempt = require('../models/BillingAttempt');
const BillingLog = require('../models/BillingLog');
const BillingSequence = require('../models/BillingSequence');

const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const customerAdapter = require('../adapters/customerAdapter');
const planAdapter = require('../adapters/planAdapter');
const invoiceAdapter = require('../adapters/invoiceAdapter');

const { calculateNextBillingDate, calculateBillingPeriod, createOrUpdateSchedule } = require('./billingScheduleService');
const { validateSubscriptionEligibility } = require('./billingEligibilityService');
const { generateSourceReference, buildInvoicePayload, validateInvoicePayload } = require('./invoicePayloadBuilder');
const { generateIdempotencyKey, reserveBillingExecution, markBillingCompleted } = require('./billingIdempotencyService');
const { scheduleRetry } = require('./billingRetryService');

/**
 * Generates an atomic billing run reference: RUN-YYYY-XXXX
 */
const generateRunReference = async () => {
  const year = new Date().getFullYear();
  const seq = await BillingSequence.getNextSequence('RUN', year);
  return `RUN-${year}-${String(seq).padStart(4, '0')}`;
};

/**
 * Processes a single subscription billing workflow
 */
const processSingleSubscription = async ({
  subscription,
  billingRun,
  asOfDate = new Date()
}) => {
  const subId = subscription.subscriptionId || subscription.id;

  // 1. Eligibility Check
  const eligibility = await validateSubscriptionEligibility(subscription, null, asOfDate);
  if (!eligibility.eligible) {
    await BillingLog.create({
      billingRunId: billingRun._id,
      event: 'SUBSCRIPTION_SKIPPED',
      message: `Subscription ${subId} skipped: ${eligibility.reason}`,
      metadata: { subscriptionId: subId, reason: eligibility.reason }
    });
    return { status: 'skipped', reason: eligibility.reason, subscriptionId: subId };
  }

  const { plan, customer } = eligibility;

  // 2. Determine billing period
  const frequency = plan.billingFrequency || subscription.billingFrequency || 'monthly';
  const interval = plan.billingInterval || subscription.billingInterval || 1;
  const periodStart = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : new Date(asOfDate);
  const billingPeriod = calculateBillingPeriod(periodStart, frequency, interval);
  const billingAmount = plan.price * (subscription.quantity || 1);

  // 3. Idempotency Key & Source Reference
  const idempotencyKey = generateIdempotencyKey(subId, billingPeriod.startDate, billingPeriod.endDate);
  const sourceReference = generateSourceReference(subId, billingPeriod.startDate);

  // 4. Reserve billing execution atomically
  const reservation = await reserveBillingExecution({
    billingRunId: billingRun._id,
    subscriptionId: subId,
    customerId: customer.customerId || customer.id,
    planId: plan.planId || plan.id,
    billingPeriodStart: billingPeriod.startDate,
    billingPeriodEnd: billingPeriod.endDate,
    billingAmount,
    currency: plan.currency || 'INR',
    idempotencyKey,
    sourceReference
  });

  if (!reservation.reserved) {
    await BillingLog.create({
      billingRunId: billingRun._id,
      event: 'DUPLICATE_BILLING_PREVENTED',
      message: `Subscription ${subId} already billed for period ${billingPeriod.startDate.toISOString()} (reason: ${reservation.reason})`,
      metadata: { subscriptionId: subId, idempotencyKey, reason: reservation.reason }
    });
    return {
      status: 'skipped',
      reason: `Already processed or collision (${reservation.reason})`,
      subscriptionId: subId,
      existingInvoiceReference: reservation.existing?.invoiceReference
    };
  }

  const execution = reservation.execution;

  // 5. Build and validate invoice payload
  const invoicePayload = buildInvoicePayload({
    subscription,
    plan,
    customer,
    billingPeriod,
    sourceReference,
    idempotencyKey
  });

  const payloadValidation = validateInvoicePayload(invoicePayload);
  if (!payloadValidation.valid) {
    const errorMsg = `Invalid invoice payload: ${payloadValidation.errors.join(', ')}`;
    await scheduleRetry(execution, errorMsg);
    return { status: 'failed', error: errorMsg, subscriptionId: subId };
  }

  // 6. Dispatch to M10 Invoice Engine via Adapter
  try {
    const invoiceResult = await invoiceAdapter.createInvoiceFromBillingPayload(invoicePayload);

    // 7. Mark execution successful
    await markBillingCompleted(idempotencyKey, invoiceResult);

    // Record attempt
    await BillingAttempt.create({
      billingExecutionId: execution._id,
      attemptNumber: execution.attemptCount,
      status: 'success',
      requestReference: sourceReference,
      responseSummary: `Invoice created: ${invoiceResult.invoiceNumber} (${invoiceResult.invoiceId})`
    });

    // 8. Calculate and advance next billing date
    const nextDate = calculateNextBillingDate(periodStart, frequency, interval);
    await subscriptionAdapter.updateNextBillingDate(subId, nextDate);

    // Update internal schedule
    await createOrUpdateSchedule({
      subscriptionId: subId,
      customerId: customer.customerId || customer.id,
      planId: plan.planId || plan.id,
      billingFrequency: frequency,
      billingInterval: interval,
      billingStartDate: subscription.startDate || periodStart,
      amountSnapshot: billingAmount,
      currency: plan.currency || 'INR'
    });

    await BillingLog.create({
      billingRunId: billingRun._id,
      billingExecutionId: execution._id,
      event: 'BILLING_SUCCESS',
      message: `Subscription ${subId} successfully billed. Invoice ${invoiceResult.invoiceNumber} generated. Next billing date: ${nextDate.toISOString()}`,
      metadata: {
        subscriptionId: subId,
        invoiceNumber: invoiceResult.invoiceNumber,
        invoiceId: invoiceResult.invoiceId,
        nextBillingDate: nextDate
      }
    });

    return {
      status: 'success',
      subscriptionId: subId,
      invoiceNumber: invoiceResult.invoiceNumber,
      invoiceId: invoiceResult.invoiceId,
      nextBillingDate: nextDate
    };
  } catch (err) {
    const errorMsg = err.message || 'M10 Invoice dispatch failed';
    await scheduleRetry(execution, errorMsg);
    return {
      status: 'failed',
      subscriptionId: subId,
      error: errorMsg
    };
  }
};

/**
 * Executes a full billing run (Scheduled, Manual, or Specific Subscriptions)
 */
const executeBillingRun = async ({
  triggerType = 'manual',
  triggeredBy = 'system',
  subscriptionIds = null,
  asOfDate = new Date()
} = {}) => {
  const runReference = await generateRunReference();

  const billingRun = new BillingRun({
    runReference,
    triggerType,
    triggeredBy,
    startedAt: new Date(),
    status: 'processing'
  });
  await billingRun.save();

  await BillingLog.create({
    billingRunId: billingRun._id,
    event: 'BILLING_RUN_STARTED',
    message: `Billing run ${runReference} started (trigger: ${triggerType}) by ${triggeredBy}`,
    metadata: { triggerType, triggeredBy, asOfDate }
  });

  try {
    // Determine target subscriptions
    let candidates = [];
    if (subscriptionIds && subscriptionIds.length > 0) {
      candidates = await Promise.all(subscriptionIds.map((id) => subscriptionAdapter.getSubscriptionById(id)));
      candidates = candidates.filter(Boolean);
    } else {
      candidates = await subscriptionAdapter.getDueSubscriptions(asOfDate);
    }

    billingRun.totalExamined = candidates.length;

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const executionResults = [];

    // Process each candidate (individual failure does not break the batch)
    for (const sub of candidates) {
      try {
        const result = await processSingleSubscription({
          subscription: sub,
          billingRun,
          asOfDate
        });

        executionResults.push(result);
        if (result.status === 'success') successCount++;
        else if (result.status === 'failed') {
          failedCount++;
          if (result.error) errors.push(`${result.subscriptionId}: ${result.error}`);
        } else if (result.status === 'skipped') skippedCount++;
      } catch (err) {
        failedCount++;
        const subId = sub.subscriptionId || sub.id;
        errors.push(`${subId}: ${err.message}`);
        await BillingLog.create({
          billingRunId: billingRun._id,
          event: 'UNHANDLED_SUBSCRIPTION_ERROR',
          message: `Unexpected error on subscription ${subId}: ${err.message}`,
          metadata: { subscriptionId: subId, error: err.stack }
        });
      }
    }

    billingRun.eligibleCount = successCount + failedCount;
    billingRun.successCount = successCount;
    billingRun.failedCount = failedCount;
    billingRun.skippedCount = skippedCount;
    billingRun.errorSummary = errors.slice(0, 50); // Keep top 50
    billingRun.completedAt = new Date();

    if (failedCount > 0 && successCount > 0) {
      billingRun.status = 'completed_with_errors';
    } else if (failedCount > 0 && successCount === 0) {
      billingRun.status = 'failed';
    } else {
      billingRun.status = 'completed';
    }

    billingRun.summary = `Processed ${candidates.length} candidates: ${successCount} succeeded, ${failedCount} failed, ${skippedCount} skipped.`;
    await billingRun.save();

    await BillingLog.create({
      billingRunId: billingRun._id,
      event: 'BILLING_RUN_COMPLETED',
      message: `Billing run ${runReference} finished with status ${billingRun.status}. ${billingRun.summary}`,
      metadata: { summary: billingRun.summary, status: billingRun.status }
    });

    return {
      success: true,
      billingRun,
      results: executionResults
    };
  } catch (fatalErr) {
    billingRun.status = 'failed';
    billingRun.completedAt = new Date();
    billingRun.summary = `Fatal run failure: ${fatalErr.message}`;
    billingRun.errorSummary = [fatalErr.message];
    await billingRun.save();

    await BillingLog.create({
      billingRunId: billingRun._id,
      event: 'BILLING_RUN_FATAL_ERROR',
      message: `Fatal error in run ${runReference}: ${fatalErr.message}`,
      metadata: { error: fatalErr.stack }
    });

    throw fatalErr;
  }
};

/**
 * Triggers billing for an individual subscription manually
 */
const processSubscriptionBilling = async (subscriptionId, options = {}) => {
  return await executeBillingRun({
    triggerType: 'manual',
    triggeredBy: options.triggeredBy || 'admin_manual_trigger',
    subscriptionIds: [subscriptionId],
    asOfDate: options.asOfDate || new Date()
  });
};

/**
 * Retries failed executions belonging to a billing run
 */
const retryFailedBillingRun = async (runId, triggeredBy = 'admin_retry') => {
  const originalRun = await BillingRun.findById(runId);
  if (!originalRun) {
    throw new Error(`Billing run '${runId}' not found`);
  }

  const failedExecutions = await BillingExecution.find({
    billingRunId: runId,
    status: { $in: ['failed', 'retry_scheduled'] }
  });

  if (failedExecutions.length === 0) {
    return {
      success: true,
      message: 'No failed executions found in this run to retry',
      retriedCount: 0
    };
  }

  const subIds = [...new Set(failedExecutions.map((e) => e.subscriptionId))];
  const retryResult = await executeBillingRun({
    triggerType: 'retry',
    triggeredBy,
    subscriptionIds: subIds
  });

  return {
    success: true,
    message: `Retried ${subIds.length} failed subscriptions from run ${originalRun.runReference}`,
    retryRun: retryResult.billingRun,
    results: retryResult.results
  };
};

module.exports = {
  generateRunReference,
  processSingleSubscription,
  executeBillingRun,
  processSubscriptionBilling,
  retryFailedBillingRun
};
