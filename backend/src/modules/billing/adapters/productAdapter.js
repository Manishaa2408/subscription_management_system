/**
 * M9 Product Adapter
 * Standalone development adapter to decouple M9 from M3 (Product & Variant Management).
 */

const SEED_PRODUCTS = [
  {
    id: 'prod_bright_core',
    productId: 'prod_bright_core',
    name: 'Brightloop Recurring Engine Core',
    category: 'Software as a Service',
    hsnCode: '997331',
    description: 'Core subscription management licensing'
  },
  {
    id: 'prod_analytics_addon',
    productId: 'prod_analytics_addon',
    name: 'Advanced MRR & Churn Analytics Add-on',
    category: 'SaaS Addon',
    hsnCode: '998314',
    description: 'Real-time telemetry and predictive retention modeling'
  }
];

const getProductById = async (productId) => {
  if (!productId) return null;
  return SEED_PRODUCTS.find((p) => p.id === productId || p.productId === productId) || null;
};

const getProductDetails = async (productId) => {
  return await getProductById(productId);
};

const getProductPrice = async (productId) => {
  // Product pricing is resolved through plan adapter
  return null;
};

module.exports = {
  SEED_PRODUCTS,
  getProductById,
  getProductDetails,
  getProductPrice
};
