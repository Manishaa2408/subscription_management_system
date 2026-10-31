const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../adapters/authAdapter');
const {
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
} = require('../controllers/analyticsController');

router.use(authenticate);

// Revenue Analytics
router.get('/revenue/trends', authorize('admin', 'staff'), getRevenueTrends);
router.get('/revenue/by-product', authorize('admin', 'staff'), getRevenueByProduct);
router.get('/revenue/by-plan', authorize('admin', 'staff'), getRevenueByPlan);
router.get('/revenue/comparison', authorize('admin', 'staff'), getRevenueComparison);

// Customer Analytics
router.get('/customers/growth', authorize('admin', 'staff'), getCustomerGrowth);
router.get('/customers/distribution', authorize('admin', 'staff'), getCustomerDistribution);

// Subscription Analytics
router.get('/subscriptions/growth', authorize('admin', 'staff'), getSubscriptionGrowth);
router.get('/subscriptions/status', authorize('admin', 'staff'), getSubscriptionStatus);
router.get('/subscriptions/churn', authorize('admin', 'staff'), getSubscriptionChurn);
router.get('/subscriptions/by-plan', authorize('admin', 'staff'), getSubscriptionByPlan);

// Product Analytics
router.get('/products/performance', authorize('admin', 'staff'), getProductPerformance);

// Billing Analytics
router.get('/billing/trends', authorize('admin', 'staff'), getBillingTrends);

// Invoice & Tax Analytics
router.get('/invoices/trends', authorize('admin', 'staff'), getInvoiceTrends);
router.get('/invoices/tax', authorize('admin'), getInvoiceTax); // Admin only for tax

// Payment Analytics
router.get('/payments/trends', authorize('admin', 'staff'), getPaymentTrends);
router.get('/payments/methods', authorize('admin', 'staff'), getPaymentMethods);

// Quotation & Discount Analytics
router.get('/quotations/conversion', authorize('admin', 'staff'), getQuotationConversion);
router.get('/discounts/summary', authorize('admin', 'staff'), getDiscountSummary);

module.exports = router;
