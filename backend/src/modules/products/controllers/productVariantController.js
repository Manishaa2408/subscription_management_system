// backend/src/modules/products/controllers/productVariantController.js
const productVariantService = require('../services/productVariantService');

/** Create a variant for a product */
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const variant = await productVariantService.createVariant(productId, req.body, req.user);
    res.status(201).json({ success: true, message: 'Variant created', data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** List variants for a product */
const listVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await productVariantService.listVariants(productId, req.query);
    res.json({ success: true, data: result.variants, pagination: result.pagination });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get a variant */
const getVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const variant = await productVariantService.getVariantById(productId, variantId);
    res.json({ success: true, data: variant });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/** Update variant */
const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const variant = await productVariantService.updateVariant(productId, variantId, req.body, req.user);
    res.json({ success: true, message: 'Variant updated', data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Change variant status */
const changeStatus = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { status } = req.body;
    const variant = await productVariantService.changeStatus(productId, variantId, status, req.user);
    res.json({ success: true, message: 'Status updated', data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Archive variant */
const archiveVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const variant = await productVariantService.archiveVariant(productId, variantId, req.user);
    res.json({ success: true, message: 'Variant archived', data: variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Variant activity */
const getActivity = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const logs = await productVariantService.getVariantActivity(productId, variantId);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createVariant,
  listVariants,
  getVariant,
  updateVariant,
  changeStatus,
  archiveVariant,
  getActivity
};
