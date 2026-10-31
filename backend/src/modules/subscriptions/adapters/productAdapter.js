import productAdapter from "../../quotations/adapters/productAdapter.js";

/**
 * Product Adapter for Subscription Lifecycle Management (M7)
 * Interfaces with Module M3
 */

export const getProducts = async () => {
  return await productAdapter.getProducts();
};

export const getProductById = async (productId) => {
  return await productAdapter.getProductById(productId);
};

export const getVariantById = async (productId, variantId) => {
  return await productAdapter.getVariantById(productId, variantId);
};

export default {
  getProducts,
  getProductById,
  getVariantById
};
