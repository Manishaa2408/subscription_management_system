import productCatalogAdapter from "../../quotationTemplates/adapters/productCatalogAdapter.js";

/**
 * Product Adapter for Quotation Management (M6)
 * Simulates Developer 1's Module M3 (Product & Variant Management)
 */

export const getProducts = async () => {
  return await productCatalogAdapter.getProducts();
};

export const getProductById = async (productId) => {
  return await productCatalogAdapter.getProductById(productId);
};

export const getVariantById = async (productId, variantId) => {
  const product = await getProductById(productId);
  if (!product || !product.variants) return null;
  return product.variants.find(v => v.variantId === variantId) || null;
};

export const validateProductAvailability = async (productId) => {
  const result = await productCatalogAdapter.validateProduct(productId);
  return result;
};

export const calculateVariantPrice = async (productId, variantId) => {
  return await productCatalogAdapter.calculateVariantPrice(productId, variantId);
};

export default {
  getProducts,
  getProductById,
  getVariantById,
  validateProductAvailability,
  calculateVariantPrice
};
