const invoiceAdapter = require('../adapters/invoiceAnalyticsAdapter');
const paymentAdapter = require('../adapters/paymentAnalyticsAdapter');
const customerAdapter = require('../adapters/customerAnalyticsAdapter');
const subscriptionAdapter = require('../adapters/subscriptionAnalyticsAdapter');
const productAdapter = require('../adapters/productAnalyticsAdapter');
const planAdapter = require('../adapters/planAnalyticsAdapter');
const billingAdapter = require('../adapters/billingAnalyticsAdapter');
const quotationAdapter = require('../adapters/quotationAnalyticsAdapter');
const discountAdapter = require('../adapters/discountAnalyticsAdapter');
const { calculateTaxSummary, calculatePercentageChange } = require('../services/analyticsCalculationService');

// ── Revenue Analytics ──
const getRevenueTrends = async (req, res, next) => {
  try {
    const data = await paymentAdapter.getPaymentTrends();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getRevenueByProduct = async (req, res, next) => {
  try {
    const data = await productAdapter.getProductPerformance();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getRevenueByPlan = async (req, res, next) => {
  try {
    const data = await planAdapter.getPlanPerformance();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getRevenueComparison = async (req, res, next) => {
  try {
    const currentInvoiced = 163371;
    const previousInvoiced = 141600;
    const currentCollected = 145079;
    const previousCollected = 120000;

    res.status(200).json({
      success: true,
      data: {
        invoiced: {
          current: currentInvoiced,
          previous: previousInvoiced,
          diff: currentInvoiced - previousInvoiced,
          percentageChange: calculatePercentageChange(currentInvoiced, previousInvoiced)
        },
        collected: {
          current: currentCollected,
          previous: previousCollected,
          diff: currentCollected - previousCollected,
          percentageChange: calculatePercentageChange(currentCollected, previousCollected)
        }
      }
    });
  } catch (err) { next(err); }
};

// ── Customer Analytics ──
const getCustomerGrowth = async (req, res, next) => {
  try {
    const data = await customerAdapter.getCustomerGrowth(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getCustomerDistribution = async (req, res, next) => {
  try {
    const [status, type] = await Promise.all([
      customerAdapter.getCustomerStatusBreakdown(),
      customerAdapter.getCustomerTypeBreakdown()
    ]);
    res.status(200).json({ success: true, data: { status, type } });
  } catch (err) { next(err); }
};

// ── Subscription Analytics ──
const getSubscriptionGrowth = async (req, res, next) => {
  try {
    const data = await subscriptionAdapter.getSubscriptionGrowth();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSubscriptionStatus = async (req, res, next) => {
  try {
    const data = await subscriptionAdapter.getSubscriptionStatusBreakdown();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSubscriptionChurn = async (req, res, next) => {
  try {
    const data = await subscriptionAdapter.getSubscriptionChurnData();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSubscriptionByPlan = async (req, res, next) => {
  try {
    const data = await planAdapter.getPlanDistribution();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Product Analytics ──
const getProductPerformance = async (req, res, next) => {
  try {
    const data = await productAdapter.getProductPerformance();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Billing Analytics ──
const getBillingTrends = async (req, res, next) => {
  try {
    const data = await billingAdapter.getBillingTrends();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Invoice & Tax Analytics ──
const getInvoiceTrends = async (req, res, next) => {
  try {
    const data = await invoiceAdapter.getInvoiceTrends();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getInvoiceTax = async (req, res, next) => {
  try {
    const data = await calculateTaxSummary(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Payment Analytics ──
const getPaymentTrends = async (req, res, next) => {
  try {
    const data = await paymentAdapter.getPaymentTrends();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getPaymentMethods = async (req, res, next) => {
  try {
    const summary = await paymentAdapter.getPaymentSummary(req.query);
    res.status(200).json({ success: true, data: summary.methodBreakdown });
  } catch (err) { next(err); }
};

// ── Quotation & Discount Analytics ──
const getQuotationConversion = async (req, res, next) => {
  try {
    const data = await quotationAdapter.getQuotationConversionData();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getDiscountSummary = async (req, res, next) => {
  try {
    const data = await discountAdapter.getDiscountSummary();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getRevenueTrends,
  getRevenueByProduct,
  getRevenueByPlan,
  getRevenueComparison,
  getCustomerGrowth,
  getCustomerDistribution,
  getSubscriptionGrowth,
  getSubscriptionStatus,
  getSubscriptionChurn,
  getSubscriptionByPlan,
  getProductPerformance,
  getBillingTrends,
  getInvoiceTrends,
  getInvoiceTax,
  getPaymentTrends,
  getPaymentMethods,
  getQuotationConversion,
  getDiscountSummary
};
