import productAdapter from "../../quotations/adapters/productAdapter.js";

/**
 * Product Adapter for Discount Management (M8)
 * Simulates Developer 1's Module M3 (Product & Variant Management)
 */

export const getAllProducts = async () => {
  return await productAdapter.getProducts();
};

export const getProductById = async (productId) => {
  return await productAdapter.getProductById(productId);
};

export const getVariantById = async (productId, variantId) => {
  return await productAdapter.getVariantById(productId, variantId);
};

export default {
  getAllProducts,
  getProductById,
  getVariantById
};
