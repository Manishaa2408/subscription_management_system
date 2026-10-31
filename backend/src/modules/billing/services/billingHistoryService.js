const BillingRun = require('../models/BillingRun');
const BillingExecution = require('../models/BillingExecution');
const BillingAttempt = require('../models/BillingAttempt');
const BillingSchedule = require('../models/BillingSchedule');
const BillingLog = require('../models/BillingLog');

/**
 * Returns paginated billing runs
 */
const getBillingRuns = async (filters = {}, pagination = {}) => {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.triggerType) query.triggerType = filters.triggerType;
  if (filters.search) {
    query.runReference = { $regex: filters.search, $options: 'i' };
  }

  const [runs, total] = await Promise.all([
    BillingRun.find(query).sort({ startedAt: -1 }).skip(skip).limit(limit),
    BillingRun.countDocuments(query)
  ]);

  return {
    runs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Returns billing run details with associated executions
 */
const getBillingRunDetails = async (runId) => {
  const run = await BillingRun.findById(runId);
  if (!run) return null;

  const [executions, logs] = await Promise.all([
    BillingExecution.find({ billingRunId: runId }).sort({ createdAt: -1 }),
    BillingLog.find({ billingRunId: runId }).sort({ createdAt: 1 })
  ]);

  return {
    run,
    executions,
    logs
  };
};

/**
 * Paginated list of billing executions (History)
 */
const getBillingHistory = async (filters = {}, pagination = {}) => {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = {};
  if (filters.subscriptionId) query.subscriptionId = filters.subscriptionId;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { sourceReference: { $regex: filters.search, $options: 'i' } },
      { invoiceReference: { $regex: filters.search, $options: 'i' } },
      { subscriptionId: { $regex: filters.search, $options: 'i' } },
      { customerId: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const [executions, total] = await Promise.all([
    BillingExecution.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('billingRunId', 'runReference triggerType status'),
    BillingExecution.countDocuments(query)
  ]);

  return {
    executions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Returns failed and retry-scheduled executions
 */
const getFailedBillings = async (filters = {}, pagination = {}) => {
  return await getBillingHistory(
    { ...filters, status: { $in: ['failed', 'retry_scheduled'] } },
    pagination
  );
};

/**
 * Returns subscription's personal billing history
 */
const getSubscriptionBillingHistory = async (subscriptionId) => {
  const executions = await BillingExecution.find({ subscriptionId }).sort({ createdAt: -1 });
  const schedule = await BillingSchedule.findOne({ subscriptionId });
  return {
    subscriptionId,
    schedule,
    executions
  };
};

/**
 * Returns analytics & summary KPIs for M9 and M12 dashboard
 */
const getBillingSummary = async () => {
  const [
    totalSchedules,
    dueSchedules,
    totalRuns,
    lastRun,
    executionStats,
    frequencyStats
  ] = await Promise.all([
    BillingSchedule.countDocuments({ status: 'active' }),
    BillingSchedule.countDocuments({ status: 'active', nextBillingDate: { $lte: new Date() } }),
    BillingRun.countDocuments(),
    BillingRun.findOne().sort({ startedAt: -1 }),
    BillingExecution.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$billingAmount' }
        }
      }
    ]),
    BillingSchedule.aggregate([
      {
        $group: {
          _id: '$billingFrequency',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const statsMap = {};
  executionStats.forEach((s) => {
    statsMap[s._id] = { count: s.count, totalAmount: s.totalAmount };
  });

  const frequencyMap = {};
  frequencyStats.forEach((f) => {
    frequencyMap[f._id] = f.count;
  });

  return {
    totalSchedules,
    dueSchedules,
    totalRuns,
    lastRun,
    successExecutions: statsMap.success?.count || 0,
    successAmount: statsMap.success?.totalAmount || 0,
    failedExecutions: statsMap.failed?.count || 0,
    retryScheduledExecutions: statsMap.retry_scheduled?.count || 0,
    frequencyBreakdown: frequencyMap
  };
};

/**
 * Returns billing engine and scheduler status
 */
const getBillingStatus = async () => {
  const schedulerEnabled = process.env.BILLING_SCHEDULER_ENABLED === 'true';
  const cronExpression = process.env.BILLING_CRON_EXPRESSION || '0 0 * * *';
  const timezone = process.env.BILLING_TIMEZONE || 'Asia/Kolkata';

  const lastRun = await BillingRun.findOne().sort({ startedAt: -1 });

  return {
    engine: 'active',
    scheduler: {
      enabled: schedulerEnabled,
      cronExpression,
      timezone
    },
    lastRun: lastRun ? {
      runReference: lastRun.runReference,
      startedAt: lastRun.startedAt,
      status: lastRun.status,
      summary: lastRun.summary
    } : null
  };
};

module.exports = {
  getBillingRuns,
  getBillingRunDetails,
  getBillingHistory,
  getFailedBillings,
  getSubscriptionBillingHistory,
  getBillingSummary,
  getBillingStatus
};
