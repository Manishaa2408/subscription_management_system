/**
 * M12 Product Analytics Adapter
 * Decouples M12 from M3 (Product Management).
 */

const SEED_PRODUCTS = [
  {
    productId: 'prod_bright_core',
    name: 'Brightloop SaaS Billing Platform',
    category: 'Core Platform',
    activeSubscriptions: 8,
    invoicedRevenue: 245000,
    collectedRevenue: 218500
  },
  {
    productId: 'prod_analytics_addon',
    name: 'Predictive Churn & MRR Analytics Add-on',
    category: 'Analytics Addon',
    activeSubscriptions: 5,
    invoicedRevenue: 68000,
    collectedRevenue: 62000
  },
  {
    productId: 'prod_tax_engine',
    name: 'Automated GST Compliance Engine',
    category: 'Tax Engine',
    activeSubscriptions: 6,
    invoicedRevenue: 95000,
    collectedRevenue: 89000
  },
  {
    productId: 'prod_custom_integrations',
    name: 'Custom ERP & Webhook Gateway',
    category: 'Integrations',
    activeSubscriptions: 2,
    invoicedRevenue: 40000,
    collectedRevenue: 35000
  }
];

const getProducts = async () => [...SEED_PRODUCTS];

const getProductById = async (id) =>
  SEED_PRODUCTS.find((p) => p.productId === id) || null;

const getProductCount = async () => SEED_PRODUCTS.length;

const getProductPerformance = async () => {
  const totalRevenue = SEED_PRODUCTS.reduce((sum, p) => sum + p.invoicedRevenue, 0);
  return SEED_PRODUCTS.map((p) => ({
    productId: p.productId,
    name: p.name,
    category: p.category,
    activeSubscriptions: p.activeSubscriptions,
    invoicedRevenue: p.invoicedRevenue,
    collectedRevenue: p.collectedRevenue,
    revenueShare: totalRevenue > 0 ? parseFloat(((p.invoicedRevenue / totalRevenue) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.invoicedRevenue - a.invoicedRevenue);
};

module.exports = {
  SEED_PRODUCTS,
  getProducts,
  getProductById,
  getProductCount,
  getProductPerformance
};
