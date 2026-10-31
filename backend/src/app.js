const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ── M1: Auth & Role Management ──────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// ── M2: Customer Management & Portal ───────────────────────────────────────
const customerRoutes = require('./modules/customers/routes/customerRoutes');
const customerPortalRoutes = require('./modules/customers/routes/customerPortalRoutes');

// ── M3: Product & Variant Management ───────────────────────────────────────
const productRoutes = require('./modules/products/routes/productRoutes');
const productCategoryRoutes = require('./modules/products/routes/productCategoryRoutes');
const productVariantRoutes = require('./modules/products/routes/productVariantRoutes');

// ── M4: Subscription Plan Management ───────────────────────────────────────
const planRoutes = require('./modules/plans/routes/planRoutes');

// ── M5: Quotation Template Management ──────────────────────────────────────
const quotationTemplateRoutes = require('./modules/quotationTemplates/routes/quotationTemplateRoutes');

// ── M6: Quotation Management ────────────────────────────────────────────────
const quotationRoutes = require('./modules/quotations/routes/quotationRoutes');

// ── M7: Subscription Lifecycle Management ──────────────────────────────────
const subscriptionRoutes = require('./modules/subscriptions/routes/subscriptionRoutes');

// ── M8: Discount Management ─────────────────────────────────────────────────
const discountCampaignRoutes = require('./modules/discounts/routes/discountCampaignRoutes');
const discountRoutes = require('./modules/discounts/routes/discountRoutes');

// ── M9: Recurring Billing Engine ────────────────────────────────────────────
let billingEngineRoutes;
try {
  billingEngineRoutes = require('./modules/billing/routes/billingRoutes');
} catch (e) {
  billingEngineRoutes = null;
}

// ── M10: Invoice & Tax Management ───────────────────────────────────────────
let invoiceRoutes, taxRoutes;
try {
  invoiceRoutes = require('./modules/invoices/routes/invoiceRoutes');
  taxRoutes = require('./modules/invoices/routes/taxRoutes');
} catch (e) {
  invoiceRoutes = null;
  taxRoutes = null;
}

// ── M11: Payment & Reconciliation ───────────────────────────────────────────
let paymentRoutes;
try {
  paymentRoutes = require('./modules/payments/routes/paymentRoutes');
} catch (e) {
  paymentRoutes = null;
}

// ── M12: Dashboard & Analytics ──────────────────────────────────────────────
let analyticsRoutes;
try {
  analyticsRoutes = require('./modules/analytics/routes/analyticsRoutes');
} catch (e) {
  analyticsRoutes = null;
}

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-dev-role']
  })
);

// ── Body Parsers ─────────────────────────────────────────────────────────────
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// M2
app.use('/api/customers', customerRoutes);
app.use('/api/customer-portal', customerPortalRoutes);

// M3
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products/:productId/variants', productVariantRoutes);

// M4
app.use('/api/plans', planRoutes);

// M5
app.use('/api/quotation-templates', quotationTemplateRoutes);

// M6
app.use('/api/quotations', quotationRoutes);

// M7
app.use('/api/subscriptions', subscriptionRoutes);

// M8
app.use('/api/discount-campaigns', discountCampaignRoutes);
app.use('/api/discounts', discountRoutes);

// M9 (optional – mounted if module exists)
if (billingEngineRoutes) app.use('/api/billing', billingEngineRoutes);

// M10 (optional)
if (invoiceRoutes) app.use('/api/invoices', invoiceRoutes);
if (taxRoutes) app.use('/api/taxes', taxRoutes);

// M11 (optional)
if (paymentRoutes) app.use('/api/payments', paymentRoutes);

// M12 (optional)
if (analyticsRoutes) app.use('/api/analytics', analyticsRoutes);

// ── 404 & Error Handler ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
