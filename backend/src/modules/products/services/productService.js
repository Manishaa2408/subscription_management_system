// backend/src/modules/products/services/productService.js
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductActivity = require('../models/ProductActivity');
const { logActivity } = require('./productActivityService');

/** Helper to build search query */
const buildQuery = (params) => {
  const {
    search,
    categoryId,
    productType,
    status,
    minPrice,
    maxPrice,
    currency,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  const query = {};
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: regex },
      { productCode: regex },
      { sku: regex },
      { shortDescription: regex },
      { description: regex }
    ];
  }
  if (categoryId) query.categoryId = categoryId;
  if (productType) query.productType = productType;
  if (status) query.status = status;
  if (minPrice !== undefined) query.basePrice = { ...(query.basePrice || {}), $gte: Number(minPrice) };
  if (maxPrice !== undefined) query.basePrice = { ...(query.basePrice || {}), $lte: Number(maxPrice) };
  if (currency) query.currency = currency;

  const allowedSorts = ['name', 'basePrice', 'createdAt', 'updatedAt'];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  return { query, options: { sort: { [sortField]: sortDirection }, page: Number(page), limit: Number(limit) } };
};

/** Create a new product */
const createProduct = async (data, currentUser) => {
  const {
    name,
    productCode,
    sku,
    shortDescription,
    description,
    categoryId,
    productType = 'software',
    basePrice,
    currency = 'INR',
    imageUrl,
    images,
    tags,
    features,
    specifications,
    status = 'active'
  } = data;

  // Basic validations
  if (!name || !productCode || !sku) {
    throw new Error('Name, productCode and sku are required');
  }
  if (basePrice == null || basePrice < 0) {
    throw new Error('Base price must be a non‑negative number');
  }
  // Ensure unique productCode and sku – mongoose indexes will enforce, but we double‑check for nicer error messages
  const existingCode = await Product.findOne({ productCode });
  if (existingCode) throw new Error('Product code already exists');
  const existingSku = await Product.findOne({ sku });
  if (existingSku) throw new Error('SKU already exists');

  // Verify category if supplied
  if (categoryId) {
    const cat = await ProductCategory.findById(categoryId);
    if (!cat) throw new Error('Category not found');
    if (cat.status !== 'active') throw new Error('Cannot assign inactive category');
  }

  const product = await Product.create({
    name,
    productCode,
    sku,
    shortDescription: shortDescription || '',
    description: description || '',
    categoryId: categoryId || null,
    productType,
    basePrice,
    currency,
    imageUrl: imageUrl || '',
    images: images || [],
    tags: tags || [],
    features: features || [],
    specifications: specifications || {},
    status,
    createdBy: currentUser?.id || null,
    updatedBy: currentUser?.id || null
  });

  await logActivity({
    productId: product._id,
    action: 'PRODUCT_CREATED',
    description: `Product ${product.productCode} created`,
    performedBy: currentUser?.id || null,
    newValue: product
  });

  return product;
};

/** List products with pagination and filters */
const listProducts = async (params) => {
  const { query, options } = buildQuery(params);
  const skip = (options.page - 1) * options.limit;
  const [products, total] = await Promise.all([
    Product.find(query).sort(options.sort).skip(skip).limit(options.limit),
    Product.countDocuments(query)
  ]);
  return {
    products,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit) || 1
    }
  };
};

/** Get a single product by id */
const getProductById = async (id) => {
  const product = await Product.findById(id).populate('categoryId');
  if (!product) throw new Error('Product not found');
  return product;
};

/** Update product fields (admin only) */
const updateProduct = async (id, updates, currentUser) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  // Disallow changes to immutable identifiers unless explicitly allowed
  const immutable = ['productCode', 'sku'];
  immutable.forEach((field) => {
    if (updates[field] && updates[field] !== product[field]) {
      throw new Error(`${field} cannot be modified`);
    }
  });

  // If category is being changed, validate it
  if (updates.categoryId && updates.categoryId !== String(product.categoryId)) {
    const cat = await ProductCategory.findById(updates.categoryId);
    if (!cat) throw new Error('Category not found');
    if (cat.status !== 'active') throw new Error('Cannot assign inactive category');
  }

  const before = product.toObject();
  Object.assign(product, updates, { updatedBy: currentUser?.id || null });
  await product.save();

  await logActivity({
    productId: product._id,
    action: 'PRODUCT_UPDATED',
    description: `Product ${product.productCode} updated`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: product
  });

  return product;
};

/** Change product status (activate, deactivate, archive) */
const changeStatus = async (id, newStatus, currentUser) => {
  const allowed = ['active', 'inactive', 'archived'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid status');
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');
  const before = product.status;
  product.status = newStatus;
  product.updatedBy = currentUser?.id || null;
  await product.save();
  await logActivity({
    productId: product._id,
    action: 'PRODUCT_STATUS_CHANGED',
    description: `Status changed from ${before} to ${newStatus}`,
    performedBy: currentUser?.id || null,
    previousValue: before,
    newValue: newStatus
  });
  return product;
};

/** Soft‑delete / archive */
const archiveProduct = async (id, currentUser) => {
  return changeStatus(id, 'archived', currentUser);
};

/** Retrieve activity log */
const getProductActivity = async (productId) => {
  return ProductActivity.find({ productId }).sort({ createdAt: -1 });
};

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  changeStatus,
  archiveProduct,
  getProductActivity
};
