const {
  calculatePercentageChange,
  calculateRevenueSummary,
  calculateCustomerGrowth,
  calculateSubscriptionGrowth,
  calculateBillingSuccessRate,
  calculateQuotationConversionRate
} = require('./analyticsCalculationService');

const invoiceAdapter = require('../adapters/invoiceAnalyticsAdapter');
const paymentAdapter = require('../adapters/paymentAnalyticsAdapter');
const billingAdapter = require('../adapters/billingAnalyticsAdapter');
const productAdapter = require('../adapters/productAnalyticsAdapter');
const planAdapter = require('../adapters/planAnalyticsAdapter');

/**
 * Compiles the primary executive KPI dataset with period comparisons
 */
const getOverviewKPIs = async (query = {}) => {
  const [
    revenue,
    customers,
    subscriptions,
    billing,
    quotations,
    invoiceTrends,
    paymentTrends,
    productPerformance
  ] = await Promise.all([
    calculateRevenueSummary(query),
    calculateCustomerGrowth(query),
    calculateSubscriptionGrowth(),
    calculateBillingSuccessRate(),
    calculateQuotationConversionRate(),
    invoiceAdapter.getInvoiceTrends(),
    paymentAdapter.getPaymentTrends(),
    productAdapter.getProductPerformance()
  ]);

  // Previous period reference values for comparison
  const previousInvoiced = 141600; // Previous month baseline
  const previousCollected = 120000;
  const previousCustomers = 5;
  const previousActiveSubs = 4;

  return {
    kpis: {
      customers: {
        total: customers.totalCustomers,
        active: customers.statusBreakdown.active,
        newCount: customers.newCustomers,
        previousTotal: previousCustomers,
        percentageChange: calculatePercentageChange(customers.totalCustomers, previousCustomers),
        trend: 'up'
      },
      subscriptions: {
        total: subscriptions.totalSubscriptions,
        active: subscriptions.activeSubscriptions,
        cancelled: subscriptions.cancelledSubscriptions,
        churnRate: subscriptions.churnRate,
        retentionRate: subscriptions.retentionRate,
        previousActive: previousActiveSubs,
        percentageChange: calculatePercentageChange(subscriptions.activeSubscriptions, previousActiveSubs),
        trend: 'up'
      },
      revenue: {
        invoiced: revenue.totalInvoicedAmount,
        collected: revenue.totalCollectedAmount,
        netCollected: revenue.netCollectedAmount,
        outstanding: revenue.outstandingAmount,
        overdue: revenue.overdueAmount,
        refunded: revenue.refundedAmount,
        previousInvoiced,
        invoicedChange: calculatePercentageChange(revenue.totalInvoicedAmount, previousInvoiced),
        previousCollected,
        collectedChange: calculatePercentageChange(revenue.totalCollectedAmount, previousCollected),
        currency: 'INR'
      },
      billing: {
        totalRuns: billing.totalRuns,
        successRate: billing.successRate,
        successfulExecutions: billing.successfulExecutions,
        failedExecutions: billing.failedExecutions,
        upcomingDueCount: billing.upcomingDueCount
      },
      quotations: {
        conversionRate: quotations.conversionRate,
        acceptedCount: quotations.acceptedCount,
        totalValue: quotations.totalValue
      }
    },
    charts: {
      revenueTrends: paymentTrends.map((p, idx) => ({
        period: p.period,
        collected: p.collected,
        invoiced: invoiceTrends[idx]?.invoiced || p.collected,
        net: p.net
      })),
      customerGrowth: customers.growthTimeline,
      subscriptionGrowth: subscriptions.growthTimeline,
      productPerformance: productPerformance.slice(0, 5)
    }
  };
};

module.exports = {
  getOverviewKPIs
};
