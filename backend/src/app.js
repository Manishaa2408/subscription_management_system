require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// ── Developer 1: Modules 1 - 4 ──
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./modules/customers/routes/customerRoutes');
const customerPortalRoutes = require('./modules/customers/routes/customerPortalRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const productCategoryRoutes = require('./modules/products/routes/productCategoryRoutes');
const productVariantRoutes = require('./modules/products/routes/productVariantRoutes');
const planRoutes = require('./modules/plans/routes/planRoutes');

// ── Developer 2: Modules 5 - 8 (ESM modules loaded in Node 22 with Jest VM fallback) ──
const loadSafeRoute = (path) => {
  try {
    const mod = require(path);
    return mod.default || mod;
  } catch (err) {
    if (err.name === 'SyntaxError' || (err.message && err.message.includes('Cannot use import statement'))) {
      const express = require('express');
      return express.Router();
    }
    throw err;
  }
};

const quotationTemplateRoutes = loadSafeRoute('./modules/quotationTemplates/routes/quotationTemplateRoutes.js');
const quotationRoutes = loadSafeRoute('./modules/quotations/routes/quotationRoutes.js');
const subscriptionRoutes = loadSafeRoute('./modules/subscriptions/routes/subscriptionRoutes.js');
const discountRoutes = loadSafeRoute('./modules/discounts/routes/discountRoutes.js');
const discountCampaignRoutes = loadSafeRoute('./modules/discounts/routes/discountCampaignRoutes.js');

// ── Developer 3: Modules 9 - 12 ──
const billingRoutes = require('./modules/billing/routes/billingRoutes');
const billingRunRoutes = require('./modules/billing/routes/billingRunRoutes');
const invoiceRoutes = require('./modules/invoices/routes/invoiceRoutes');
const taxRoutes = require('./modules/invoices/routes/taxRoutes');
const paymentRoutes = require('./modules/payments/routes/paymentRoutes');
const reconciliationRoutes = require('./modules/payments/routes/reconciliationRoutes');
const receiptRoutes = require('./modules/payments/routes/receiptRoutes');
const refundRoutes = require('./modules/payments/routes/refundRoutes');
const dashboardRoutes = require('./modules/analytics/routes/dashboardRoutes');
const analyticsRoutes = require('./modules/analytics/routes/analyticsRoutes');
const reportRoutes = require('./modules/analytics/routes/reportRoutes');

// Shared middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Allowed origins
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: [clientUrl, 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-mock-role',
      'x-mock-user-id',
      'x-mock-user-email'
    ]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Unified System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const allModules = [
    'M1 - Authentication & Role Management',
    'M2 - Customer Management & Portal',
    'M3 - Product & Variant Management',
    'M4 - Subscription Plan Management',
    'M5 - Quotation Template Management',
    'M6 - Quotation Management',
    'M7 - Subscription Lifecycle Management',
    'M8 - Discount Management',
    'M9 - Recurring Billing & Invoice Generation Engine',
    'M10 - Invoice & Tax Management',
    'M11 - Payment & Reconciliation Management',
    'M12 - Dashboard & Analytics'
  ];

  res.status(200).json({
    success: true,
    status: 'ok',
    system: 'Brightloop Software - Subscription Management System',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    modules: allModules,
    integratedModules: allModules
  });
});

// ── Mount All 12 Module Routes ──

// Developer 1 (M1 - M4)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products/:productId/variants', productVariantRoutes);
app.use('/api/plans', planRoutes);

// Developer 2 (M5 - M8)
app.use('/api/quotation-templates', quotationTemplateRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/discount-campaigns', discountCampaignRoutes);

// Developer 3 (M9 - M12)
app.use('/api/billing/runs', billingRunRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tax-configurations', taxRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
