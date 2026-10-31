// backend/src/modules/plans/controllers/planController.js
const planService = require('../services/planService');

/** Create a new plan */
const createPlan = async (req, res) => {
  try {
    const plan = await planService.createPlan(req.body, req.user);
    res.status(201).json({ success: true, message: 'Subscription plan created', data: { plan } });
  } catch (err) {
    const status = err.message.includes('exists') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

/** List plans (admin view) */
const listPlans = async (req, res) => {
  try {
    const result = await planService.listPlans(req.query);
    res.json({ success: true, data: result.plans, pagination: result.pagination });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get plan details */
const getPlan = async (req, res) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/** Update plan */
const updatePlan = async (req, res) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Plan updated', data: plan });
  } catch (err) {
    const status = err.message.includes('archived') ? 400 : err.message.includes('exists') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

/** Change status */
const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const plan = await planService.changeStatus(req.params.id, status, req.user);
    res.json({ success: true, message: 'Status updated', data: plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Archive plan */
const archivePlan = async (req, res) => {
  try {
    const plan = await planService.archivePlan(req.params.id, req.user);
    res.json({ success: true, message: 'Plan archived', data: plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Get activity */
const getActivity = async (req, res) => {
  try {
    const logs = await planService.getPlanActivity(req.params.id);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Catalog for customers */
const getCatalog = async (req, res) => {
  try {
    const catalog = await planService.getCatalog(req.query);
    res.json({ success: true, data: catalog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** Plans for a product */
const getPlansByProduct = async (req, res) => {
  try {
    const plans = await planService.getPlansByProduct(req.params.productId);
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  changeStatus,
  archivePlan,
  getActivity,
  getCatalog,
  getPlansByProduct
};
