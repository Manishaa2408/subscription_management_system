// backend/src/modules/products/services/productCategoryService.js
const ProductCategory = require('../models/ProductCategory');
const ProductActivity = require('../models/ProductActivity');
const { logActivity } = require('./productActivityService');

/** Create a new product category */
const createCategory = async (data, currentUser) => {
  const { name, code, description = '', parentCategoryId = null, imageUrl = '', status = 'active' } = data;
  if (!name || !code) throw new Error('Name and code are required');
  const existing = await ProductCategory.findOne({ code });
  if (existing) throw new Error('Category code already exists');
  if (parentCategoryId) {
    const parent = await ProductCategory.findById(parentCategoryId);
    if (!parent) throw new Error('Parent category not found');
    if (parent.status !== 'active') throw new Error('Parent category must be active');
  }
  const category = await ProductCategory.create({
    name,
    code,
    description,
    parentCategoryId,
    imageUrl,
    status,
    createdBy: currentUser?.id || null,
    updatedBy: currentUser?.id || null
  });
  await logActivity({
    productId: null,
    action: 'CATEGORY_CREATED',
    description: `Category ${code} created`,
    performedBy: currentUser?.id || null,
    newValue: category
  });
  return category;
};

/** List categories (optionally hierarchical) */
const listCategories = async () => {
  return ProductCategory.find().sort({ name: 1 });
};

/** Get single category */
const getCategoryById = async (id) => {
  const cat = await ProductCategory.findById(id);
  if (!cat) throw new Error('Category not found');
  return cat;
};

/** Update category */
const updateCategory = async (id, updates, currentUser) => {
  const category = await ProductCategory.findById(id);
  if (!category) throw new Error('Category not found');
  if (updates.code && updates.code !== category.code) {
    const dup = await ProductCategory.findOne({ code: updates.code });
    if (dup) throw new Error('Category code already exists');
  }
  const before = category.toObject();
  Object.assign(category, updates, { updatedBy: currentUser?.id || null });
  await category.save();
  await logActivity({
    productId: null,
    action: 'CATEGORY_UPDATED',
    description: `Category ${category.code} updated`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: category
  });
  return category;
};

/** Change status */
const changeStatus = async (id, newStatus, currentUser) => {
  const allowed = ['active', 'inactive', 'archived'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid status');
  const category = await ProductCategory.findById(id);
  if (!category) throw new Error('Category not found');
  const before = category.status;
  category.status = newStatus;
  category.updatedBy = currentUser?.id || null;
  await category.save();
  await logActivity({
    productId: null,
    action: 'CATEGORY_STATUS_CHANGED',
    description: `Status changed from ${before} to ${newStatus}`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: newStatus
  });
  return category;
};

module.exports = {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  changeStatus
};
