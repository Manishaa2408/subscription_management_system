// backend/src/modules/products/controllers/productCategoryController.js
const productCategoryService = require('../services/productCategoryService');

/** Create category */
const createCategory = async (req, res) => {
  try {
    const category = await productCategoryService.createCategory(req.body, req.user);
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** List categories */
const listCategories = async (req, res) => {
  try {
    const categories = await productCategoryService.listCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get a category */
const getCategory = async (req, res) => {
  try {
    const category = await productCategoryService.getCategoryById(req.params.id);
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/** Update category */
const updateCategory = async (req, res) => {
  try {
    const category = await productCategoryService.updateCategory(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Change status */
const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const category = await productCategoryService.changeStatus(req.params.id, status, req.user);
    res.json({ success: true, message: 'Status updated', data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  changeStatus
};
