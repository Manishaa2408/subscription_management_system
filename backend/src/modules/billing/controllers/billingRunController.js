const {
  getBillingRuns,
  getBillingRunDetails
} = require('../services/billingHistoryService');

const {
  retryFailedBillingRun
} = require('../services/recurringBillingEngine');

/**
 * GET /api/billing/runs - List billing runs
 */
const getBillingRunsHandler = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      triggerType: req.query.triggerType,
      search: req.query.search
    };
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getBillingRuns(filters, pagination);
    res.status(200).json({
      success: true,
      data: result.runs,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/billing/runs/:id - Get billing run details with associated executions
 */
const getBillingRunDetailsHandler = async (req, res, next) => {
  try {
    const result = await getBillingRunDetails(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Billing run '${req.params.id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/billing/runs/:id/retry - Retry failed executions in a run
 */
const retryBillingRunHandler = async (req, res, next) => {
  try {
    const triggeredBy = req.user ? `${req.user.role}:${req.user.email || req.user.id}` : 'admin_retry';
    const result = await retryFailedBillingRun(req.params.id, triggeredBy);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBillingRunsHandler,
  getBillingRunDetailsHandler,
  retryBillingRunHandler
};
