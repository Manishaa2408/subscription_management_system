const { getOverviewKPIs } = require('../services/dashboardService');
const {
  calculateRevenueSummary,
  calculateCustomerGrowth,
  calculateSubscriptionGrowth,
  calculateBillingSuccessRate
} = require('../services/analyticsCalculationService');

const invoiceAdapter = require('../adapters/invoiceAnalyticsAdapter');
const paymentAdapter = require('../adapters/paymentAnalyticsAdapter');

/**
 * GET /api/dashboard/overview - Complete dashboard KPI summary
 */
const getOverviewHandler = async (req, res, next) => {
  try {
    const data = await getOverviewKPIs(req.query);
    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/revenue-summary
 */
const getRevenueSummaryHandler = async (req, res, next) => {
  try {
    const data = await calculateRevenueSummary(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/customer-summary
 */
const getCustomerSummaryHandler = async (req, res, next) => {
  try {
    const data = await calculateCustomerGrowth(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/subscription-summary
 */
const getSubscriptionSummaryHandler = async (req, res, next) => {
  try {
    const data = await calculateSubscriptionGrowth(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/billing-summary
 */
const getBillingSummaryHandler = async (req, res, next) => {
  try {
    const data = await calculateBillingSuccessRate();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/invoice-summary
 */
const getInvoiceSummaryHandler = async (req, res, next) => {
  try {
    const data = await invoiceAdapter.getInvoiceRevenueSummary(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/payment-summary
 */
const getPaymentSummaryHandler = async (req, res, next) => {
  try {
    const data = await paymentAdapter.getPaymentSummary(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewHandler,
  getRevenueSummaryHandler,
  getCustomerSummaryHandler,
  getSubscriptionSummaryHandler,
  getBillingSummaryHandler,
  getInvoiceSummaryHandler,
  getPaymentSummaryHandler
};
