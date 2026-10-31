// backend/src/modules/products/services/productVariantService.js
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const ProductActivity = require('../models/ProductActivity');
const { logActivity } = require('./productActivityService');

/** Create a variant for a product */
const createVariant = async (productId, data, currentUser) => {
  const { variantName, variantCode, sku, attributes = [], description = '', additionalPrice = 0, currency = 'INR', status = 'active' } = data;
  if (!variantName || !variantCode || !sku) {
    throw new Error('variantName, variantCode and sku are required');
  }
  const product = await Product.findById(productId);
  if (!product) throw new Error('Parent product not found');

  // Unique checks
  const dupCode = await ProductVariant.findOne({ variantCode });
  if (dupCode) throw new Error('Variant code already exists');
  const dupSku = await ProductVariant.findOne({ sku });
  if (dupSku) throw new Error('SKU already exists');

  const variant = await ProductVariant.create({
    productId,
    variantName,
    variantCode,
    sku,
    attributes,
    description,
    additionalPrice,
    currency,
    status,
    createdBy: currentUser?.id || null,
    updatedBy: currentUser?.id || null
  });

  await logActivity({
    productId,
    variantId: variant._id,
    action: 'VARIANT_CREATED',
    description: `Variant ${variantCode} created for product ${product.productCode}`,
    performedBy: currentUser?.id || null,
    newValue: variant
  });
  return variant;
};

/** List variants for a product */
const listVariants = async (productId, params = {}) => {
  const { page = 1, limit = 20, status } = params;
  const filter = { productId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [variants, total] = await Promise.all([
    ProductVariant.find(filter).skip(skip).limit(limit),
    ProductVariant.countDocuments(filter)
  ]);
  return {
    variants,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/** Get single variant */
const getVariantById = async (productId, variantId) => {
  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) throw new Error('Variant not found');
  return variant;
};

/** Update variant */
const updateVariant = async (productId, variantId, updates, currentUser) => {
  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) throw new Error('Variant not found');
  // immutable fields
  const immutable = ['variantCode', 'sku'];
  immutable.forEach((field) => {
    if (updates[field] && updates[field] !== variant[field]) {
      throw new Error(`${field} cannot be modified`);
    }
  });
  const before = variant.toObject();
  Object.assign(variant, updates, { updatedBy: currentUser?.id || null });
  await variant.save();
  await logActivity({
    productId,
    variantId,
    action: 'VARIANT_UPDATED',
    description: `Variant ${variant.variantCode} updated`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: variant
  });
  return variant;
};

/** Change status */
const changeStatus = async (productId, variantId, newStatus, currentUser) => {
  const allowed = ['active', 'inactive', 'archived'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid status');
  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) throw new Error('Variant not found');
  const before = variant.status;
  variant.status = newStatus;
  variant.updatedBy = currentUser?.id || null;
  await variant.save();
  await logActivity({
    productId,
    variantId,
    action: 'VARIANT_STATUS_CHANGED',
    description: `Status changed from ${before} to ${newStatus}`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: newStatus
  });
  return variant;
};

/** Archive (soft‑delete) */
const archiveVariant = async (productId, variantId, currentUser) => {
  return changeStatus(productId, variantId, 'archived', currentUser);
};

/** Retrieve activity for a product (includes variant actions) */
const getVariantActivity = async (productId, variantId) => {
  const filter = { productId };
  if (variantId) filter.variantId = variantId;
  return ProductActivity.find(filter).sort({ createdAt: -1 });
};

module.exports = {
  createVariant,
  listVariants,
  getVariantById,
  updateVariant,
  changeStatus,
  archiveVariant,
  getVariantActivity
};
