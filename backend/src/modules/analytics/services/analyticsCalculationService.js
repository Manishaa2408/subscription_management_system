const customerAdapter = require('../adapters/customerAnalyticsAdapter');
const productAdapter = require('../adapters/productAnalyticsAdapter');
const planAdapter = require('../adapters/planAnalyticsAdapter');
const quotationAdapter = require('../adapters/quotationAnalyticsAdapter');
const subscriptionAdapter = require('../adapters/subscriptionAnalyticsAdapter');
const discountAdapter = require('../adapters/discountAnalyticsAdapter');
const billingAdapter = require('../adapters/billingAnalyticsAdapter');
const invoiceAdapter = require('../adapters/invoiceAnalyticsAdapter');
const paymentAdapter = require('../adapters/paymentAnalyticsAdapter');

/**
 * Calculates percentage change between current and previous values safely.
 * Returns 0 if previous is 0 and current is 0.
 * Returns +100% if previous is 0 and current > 0.
 */
const calculatePercentageChange = (current = 0, previous = 0) => {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0) {
    if (curr === 0) return 0;
    return 100;
  }

  const change = ((curr - prev) / prev) * 100;
  return parseFloat(change.toFixed(1));
};

/**
 * Consolidates revenue metrics separating Invoiced, Collected, Net, Outstanding, and Overdue
 */
const calculateRevenueSummary = async (dateRange = {}) => {
  const [invoiceData, paymentData] = await Promise.all([
    invoiceAdapter.getInvoiceRevenueSummary(dateRange),
    paymentAdapter.getPaymentSummary(dateRange)
  ]);

  return {
    totalInvoicedAmount: invoiceData.totalInvoicedAmount || 0,
    totalCollectedAmount: paymentData.collectedRevenue || 0,
    netCollectedAmount: paymentData.netCollectedRevenue || 0,
    outstandingAmount: invoiceData.outstandingAmount || 0,
    overdueAmount: invoiceData.overdueAmount || 0,
    refundedAmount: paymentData.refundedAmount || 0,
    pendingPaymentsAmount: paymentData.pendingPaymentsAmount || 0,
    currency: 'INR'
  };
};

/**
 * Customer growth metrics
 */
const calculateCustomerGrowth = async (dateRange = {}) => {
  const [count, newCount, breakdown, typeBreakdown, timeline] = await Promise.all([
    customerAdapter.getCustomerCount(),
    customerAdapter.getNewCustomerCount(dateRange),
    customerAdapter.getCustomerStatusBreakdown(),
    customerAdapter.getCustomerTypeBreakdown(),
    customerAdapter.getCustomerGrowth(dateRange)
  ]);

  return {
    totalCustomers: count,
    newCustomers: newCount,
    statusBreakdown: breakdown,
    typeBreakdown,
    growthTimeline: timeline
  };
};

/**
 * Subscription metrics, churn, and retention
 */
const calculateSubscriptionGrowth = async () => {
  const [subscriptions, statusBreakdown, churnData, growthTimeline] = await Promise.all([
    subscriptionAdapter.getSubscriptions(),
    subscriptionAdapter.getSubscriptionStatusBreakdown(),
    subscriptionAdapter.getSubscriptionChurnData(),
    subscriptionAdapter.getSubscriptionGrowth()
  ]);

  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: statusBreakdown.active || 0,
    pausedSubscriptions: statusBreakdown.paused || 0,
    cancelledSubscriptions: statusBreakdown.cancelled || 0,
    expiredSubscriptions: statusBreakdown.expired || 0,
    churnRate: churnData.churnRate,
    retentionRate: churnData.retentionRate,
    growthTimeline
  };
};

/**
 * Billing success rates from M9
 */
const calculateBillingSuccessRate = async () => {
  return await billingAdapter.getBillingExecutionSummary();
};

/**
 * Quotation conversion rate from M6
 */
const calculateQuotationConversionRate = async () => {
  return await quotationAdapter.getQuotationConversionData();
};

/**
 * Tax breakdown from M10
 */
const calculateTaxSummary = async (dateRange = {}) => {
  const invoiceData = await invoiceAdapter.getInvoiceRevenueSummary(dateRange);
  return invoiceData.taxSummary || { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
};

module.exports = {
  calculatePercentageChange,
  calculateRevenueSummary,
  calculateCustomerGrowth,
  calculateSubscriptionGrowth,
  calculateBillingSuccessRate,
  calculateQuotationConversionRate,
  calculateTaxSummary
};
