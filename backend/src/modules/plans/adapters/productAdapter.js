// backend/src/modules/plans/adapters/productAdapter.js
/**
 * Development product adapter for M4.
 * Uses the existing M3 product models if they exist.
 * Provides minimal methods required by the plan service.
 */

let Product, ProductVariant;
try {
  Product = require('../../products/models/Product');
  ProductVariant = require('../../products/models/ProductVariant');
} catch (e) {
  // If M3 is not available, fallback to mock data (will be defined below).
  Product = null;
  ProductVariant = null;
}

// Mock data (used only when real models are unavailable)
const mockProducts = [
  { _id: 'mock-prod-1', name: 'Project Management Software', code: 'PROJ-MGMT' },
  { _id: 'mock-prod-2', name: 'CRM Software', code: 'CRM' }
];
const mockVariants = [];

module.exports = {
  /** Get product by ID */
  async getProductById(productId) {
    if (Product) return await Product.findById(productId);
    return mockProducts.find((p) => p._id === productId) || null;
  },
  /** Get variant by ID */
  async getVariantById(variantId) {
    if (ProductVariant) return await ProductVariant.findById(variantId);
    return mockVariants.find((v) => v._id === variantId) || null;
  },
  /** Validate that product exists and is active */
  async validateProduct(productId) {
    const prod = await this.getProductById(productId);
    if (!prod) throw new Error('Product not found');
    // If real model has status, ensure it's active
    if (prod.status && prod.status !== 'active') throw new Error('Product is not active');
    return prod;
  },
  /** Validate variant belongs to product */
  async validateVariant(productId, variantId) {
    if (!variantId) return null;
    const variant = await this.getVariantById(variantId);
    if (!variant) throw new Error('Variant not found');
    if (String(variant.productId) !== String(productId)) {
      throw new Error('Variant does not belong to the specified product');
    }
    return variant;
  }
};
