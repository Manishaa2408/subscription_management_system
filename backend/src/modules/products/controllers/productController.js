// backend/src/modules/products/controllers/productController.js
const productService = require('../services/productService');

/** Create product */
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** List products */
const listProducts = async (req, res) => {
  try {
    const result = await productService.listProducts(req.query);
    res.json({ success: true, data: result.products, pagination: result.pagination });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get product by id */
const getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/** Update product */
const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Change status */
const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await productService.changeStatus(req.params.id, status, req.user);
    res.json({ success: true, message: 'Status updated', data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Archive product */
const archiveProduct = async (req, res) => {
  try {
    const product = await productService.archiveProduct(req.params.id, req.user);
    res.json({ success: true, message: 'Product archived', data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get activity log */
const getActivity = async (req, res) => {
  try {
    const logs = await productService.getProductActivity(req.params.id);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  changeStatus,
  archiveProduct,
  getActivity
};
