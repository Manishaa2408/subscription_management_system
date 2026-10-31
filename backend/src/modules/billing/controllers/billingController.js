const {
  createOrUpdateSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  getDueSchedules
} = require('../services/billingScheduleService');

const {
  executeBillingRun,
  processSubscriptionBilling
} = require('../services/recurringBillingEngine');

const {
  getBillingHistory,
  getFailedBillings,
  getBillingSummary,
  getBillingStatus,
  getSubscriptionBillingHistory
} = require('../services/billingHistoryService');

const subscriptionAdapter = require('../adapters/subscriptionAdapter');

/**
 * POST /api/billing/schedules - Create or initialize billing schedule
 */
const createScheduleHandler = async (req, res, next) => {
  try {
    const { subscriptionId, customerId, planId, billingFrequency, billingInterval, billingStartDate, amountSnapshot, currency } = req.body;

    if (!subscriptionId || !customerId || !planId || amountSnapshot === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required schedule fields: subscriptionId, customerId, planId, amountSnapshot are required',
        errors: ['Validation failed']
      });
    }

    const schedule = await createOrUpdateSchedule({
      subscriptionId,
      customerId,
      planId,
      billingFrequency: billingFrequency || 'monthly',
      billingInterval: billingInterval || 1,
      billingStartDate: billingStartDate || new Date(),
      amountSnapshot: Number(amountSnapshot),
      currency: currency || 'INR'
    });

    res.status(201).json({
      success: true,
      message: 'Billing schedule created successfully',
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/schedules - List schedules with filters and pagination
 */
const getSchedulesHandler = async (req, res, next) => {
  try {
    const filters = {
      subscriptionId: req.query.subscriptionId,
      customerId: req.query.customerId,
      planId: req.query.planId,
      status: req.query.status,
      billingFrequency: req.query.billingFrequency,
      search: req.query.search
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getSchedules(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.schedules,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/schedules/due - List schedules currently due for billing
 */
const getDueSchedulesHandler = async (req, res, next) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : new Date();
    const schedules = await getDueSchedules(asOfDate);
    const adapterDue = await subscriptionAdapter.getDueSubscriptions(asOfDate);

    res.status(200).json({
      success: true,
      data: {
        asOfDate,
        dueCount: schedules.length || adapterDue.length,
        schedules,
        adapterDueSubscriptions: adapterDue
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/schedules/:id - Get schedule details
 */
const getScheduleByIdHandler = async (req, res, next) => {
  try {
    const schedule = await getScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `Billing schedule '${req.params.id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/billing/schedules/:id - Update eligible schedule fields
 */
const updateScheduleHandler = async (req, res, next) => {
  try {
    const allowed = ['status', 'billingInterval', 'amountSnapshot', 'nextBillingDate'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const schedule = await updateSchedule(req.params.id, updates);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `Billing schedule '${req.params.id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Billing schedule updated successfully',
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/billing/run - Trigger manual billing run
 */
const triggerBillingRunHandler = async (req, res, next) => {
  try {
    const triggeredBy = req.user ? `${req.user.role}:${req.user.email || req.user.id}` : 'manual_admin';
    const { subscriptionIds, asOfDate } = req.body;

    const result = await executeBillingRun({
      triggerType: 'manual',
      triggeredBy,
      subscriptionIds: Array.isArray(subscriptionIds) ? subscriptionIds : null,
      asOfDate: asOfDate ? new Date(asOfDate) : new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Billing run completed successfully',
      data: {
        run: result.billingRun,
        results: result.results
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/billing/subscriptions/:subscriptionId/process - Process individual subscription
 */
const processSubscriptionHandler = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const triggeredBy = req.user ? `${req.user.role}:${req.user.email || req.user.id}` : 'manual_admin';

    const result = await processSubscriptionBilling(subscriptionId, {
      triggeredBy,
      asOfDate: req.body.asOfDate ? new Date(req.body.asOfDate) : new Date()
    });

    res.status(200).json({
      success: true,
      message: `Billing execution completed for subscription ${subscriptionId}`,
      data: {
        run: result.billingRun,
        result: result.results[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/subscriptions/:subscriptionId/history - Get subscription billing history
 */
const getSubscriptionHistoryHandler = async (req, res, next) => {
  try {
    const history = await getSubscriptionBillingHistory(req.params.subscriptionId);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/history - List all billing executions with search and filters
 */
const getBillingHistoryHandler = async (req, res, next) => {
  try {
    const filters = {
      subscriptionId: req.query.subscriptionId,
      customerId: req.query.customerId,
      status: req.query.status,
      search: req.query.search
    };
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getBillingHistory(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.executions,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/failed - List failed executions
 */
const getFailedBillingsHandler = async (req, res, next) => {
  try {
    const filters = {
      subscriptionId: req.query.subscriptionId,
      customerId: req.query.customerId,
      search: req.query.search
    };
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getFailedBillings(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.executions,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/summary - Get summary stats for KPIs and dashboard
 */
const getBillingSummaryHandler = async (req, res, next) => {
  try {
    const summary = await getBillingSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/status - Get engine and scheduler status
 */
const getBillingStatusHandler = async (req, res, next) => {
  try {
    const status = await getBillingStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createScheduleHandler,
  getSchedulesHandler,
  getDueSchedulesHandler,
  getScheduleByIdHandler,
  updateScheduleHandler,
  triggerBillingRunHandler,
  processSubscriptionHandler,
  getSubscriptionHistoryHandler,
  getBillingHistoryHandler,
  getFailedBillingsHandler,
  getBillingSummaryHandler,
  getBillingStatusHandler
};
