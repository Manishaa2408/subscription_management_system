const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const unwrap = (mod) => (mod && mod.default ? mod.default : mod);

// ── M1: Auth & Role Management ──────────────────────────────────────────────
const authRoutes = unwrap(require('./routes/authRoutes'));
const userRoutes = unwrap(require('./routes/userRoutes'));

// ── M2: Customer Management & Portal ───────────────────────────────────────
const customerRoutes = unwrap(require('./modules/customers/routes/customerRoutes'));
const customerPortalRoutes = unwrap(require('./modules/customers/routes/customerPortalRoutes'));

// ── M3: Product & Variant Management ───────────────────────────────────────
const productRoutes = unwrap(require('./modules/products/routes/productRoutes'));
const productCategoryRoutes = unwrap(require('./modules/products/routes/productCategoryRoutes'));
const productVariantRoutes = unwrap(require('./modules/products/routes/productVariantRoutes'));

// ── M4: Subscription Plan Management ───────────────────────────────────────
const planRoutes = unwrap(require('./modules/plans/routes/planRoutes'));

// ── M5: Quotation Template Management ──────────────────────────────────────
const quotationTemplateRoutes = unwrap(require('./modules/quotationTemplates/routes/quotationTemplateRoutes'));

// ── M6: Quotation Management ────────────────────────────────────────────────
const quotationRoutes = unwrap(require('./modules/quotations/routes/quotationRoutes'));

// ── M7: Subscription Lifecycle Management ──────────────────────────────────
const subscriptionRoutes = unwrap(require('./modules/subscriptions/routes/subscriptionRoutes'));

// ── M8: Discount Management ─────────────────────────────────────────────────
const discountCampaignRoutes = unwrap(require('./modules/discounts/routes/discountCampaignRoutes'));
const discountRoutes = unwrap(require('./modules/discounts/routes/discountRoutes'));

// ── M9: Recurring Billing Engine ────────────────────────────────────────────
let billingRoutes, billingRunRoutes;
try {
  billingRoutes = unwrap(require('./modules/billing/routes/billingRoutes'));
  billingRunRoutes = unwrap(require('./modules/billing/routes/billingRunRoutes'));
} catch (e) { billingRoutes = null; billingRunRoutes = null; }

// ── M10: Invoice & Tax Management ───────────────────────────────────────────
let invoiceRoutes, taxRoutes;
try {
  invoiceRoutes = unwrap(require('./modules/invoices/routes/invoiceRoutes'));
  taxRoutes = unwrap(require('./modules/invoices/routes/taxRoutes'));
} catch (e) { invoiceRoutes = null; taxRoutes = null; }

// ── M11: Payment & Reconciliation ───────────────────────────────────────────
let paymentRoutes, reconciliationRoutes, receiptRoutes, refundRoutes;
try {
  paymentRoutes = unwrap(require('./modules/payments/routes/paymentRoutes'));
  reconciliationRoutes = unwrap(require('./modules/payments/routes/reconciliationRoutes'));
  receiptRoutes = unwrap(require('./modules/payments/routes/receiptRoutes'));
  refundRoutes = unwrap(require('./modules/payments/routes/refundRoutes'));
} catch (e) { paymentRoutes = null; reconciliationRoutes = null; receiptRoutes = null; refundRoutes = null; }

// ── M12: Dashboard & Analytics ──────────────────────────────────────────────
let analyticsRoutes, dashboardRoutes, reportRoutes;
try {
  analyticsRoutes = unwrap(require('./modules/analytics/routes/analyticsRoutes'));
  dashboardRoutes = unwrap(require('./modules/analytics/routes/dashboardRoutes'));
  reportRoutes = unwrap(require('./modules/analytics/routes/reportRoutes'));
} catch (e) { analyticsRoutes = null; dashboardRoutes = null; reportRoutes = null; }

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-dev-role', 'x-mock-role', 'x-mock-user-id', 'x-mock-user-email']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Brightloop SMS API is healthy and operational',
    version: '1.0.0',
    modules: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'],
    timestamp: new Date().toISOString()
  });
});

// ── Mount Routes ──────────────────────────────────────────────────────────────

// M1
if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);

// M2
if (customerRoutes) app.use('/api/customers', customerRoutes);
if (customerPortalRoutes) app.use('/api/customer-portal', customerPortalRoutes);

// M3
if (productRoutes) app.use('/api/products', productRoutes);
if (productCategoryRoutes) app.use('/api/product-categories', productCategoryRoutes);
if (productVariantRoutes) app.use('/api/products/:productId/variants', productVariantRoutes);

// M4
if (planRoutes) app.use('/api/plans', planRoutes);

// M5
if (quotationTemplateRoutes) app.use('/api/quotation-templates', quotationTemplateRoutes);

// M6
if (quotationRoutes) app.use('/api/quotations', quotationRoutes);

// M7
if (subscriptionRoutes) app.use('/api/subscriptions', subscriptionRoutes);

// M8
if (discountCampaignRoutes) app.use('/api/discount-campaigns', discountCampaignRoutes);
if (discountRoutes) app.use('/api/discounts', discountRoutes);

// M9
if (billingRunRoutes) app.use('/api/billing/runs', billingRunRoutes);
if (billingRoutes) app.use('/api/billing', billingRoutes);

// M10
if (invoiceRoutes) app.use('/api/invoices', invoiceRoutes);
if (taxRoutes) app.use('/api/tax-configurations', taxRoutes);

// M11
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (reconciliationRoutes) app.use('/api/reconciliation', reconciliationRoutes);
if (receiptRoutes) app.use('/api/receipts', receiptRoutes);
if (refundRoutes) app.use('/api/refunds', refundRoutes);

// M12
if (analyticsRoutes) app.use('/api/analytics', analyticsRoutes);
if (dashboardRoutes) app.use('/api/dashboard', dashboardRoutes);
if (reportRoutes) app.use('/api/reports', reportRoutes);

// ── 404 & Error Handler ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
