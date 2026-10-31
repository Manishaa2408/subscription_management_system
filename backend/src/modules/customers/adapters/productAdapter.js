const MOCK_PRODUCTS = [
  {
    id: 'prod_101',
    name: 'Brightloop SaaS Suite - Professional',
    sku: 'BL-PRO-01',
    category: 'Software Subscription',
    basePrice: 4999,
    billingInterval: 'monthly',
    description: 'Complete ERP and subscription engine with unlimited operations'
  },
  {
    id: 'prod_102',
    name: 'Brightloop Starter Add-on - 5 Team Seats',
    sku: 'BL-ADDON-SEATS',
    category: 'Add-on',
    basePrice: 1499,
    billingInterval: 'monthly',
    description: '5 additional team user seats with staff role permissions'
  }
];

const getProducts = async () => MOCK_PRODUCTS;

const getProductById = async (productId) =>
  MOCK_PRODUCTS.find((p) => p.id === String(productId)) || null;

module.exports = {
  getProducts,
  getProductById,
  MOCK_PRODUCTS
};
