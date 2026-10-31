// backend/src/modules/plans/services/planService.js
const SubscriptionPlan = require('../models/SubscriptionPlan');
const productAdapter = require('../adapters/productAdapter');
const { logActivity } = require('./planActivityService');

/** Helper to build query for list */
const buildListQuery = (params) => {
  const { search, status, productId, billingFrequency, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = params;
  const query = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { code: regex }];
  }
  if (status) query.status = status;
  if (productId) query.productId = productId;
  if (billingFrequency) query.billingFrequency = billingFrequency;

  const sort = {};
  const allowedSorts = ['price', 'createdAt', 'name'];
  const field = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  sort[field] = sortOrder === 'asc' ? 1 : -1;

  const skip = (Number(page) - 1) * Number(limit);

  return { query, options: { sort, skip, limit: Number(limit), page: Number(page) } };
};

/** Create a new subscription plan */
const createPlan = async (data, currentUser) => {
  const {
    name,
    code,
    description = '',
    productId,
    variantId = null,
    billingFrequency,
    billingInterval = 1,
    price,
    currency = 'INR',
    trialEnabled = false,
    trialPeriodDays = 0,
    features = [],
    limits = [],
    status = 'active'
  } = data;

  // Basic validation (more in middleware)
  if (!name || !code) throw new Error('Name and code are required');
  if (!productId) throw new Error('Product reference required');
  await productAdapter.validateProduct(productId);
  if (variantId) await productAdapter.validateVariant(productId, variantId);

  const existing = await SubscriptionPlan.findOne({ code });
  if (existing) throw new Error('Plan code already exists');

  const plan = await SubscriptionPlan.create({
    name,
    code,
    description,
    productId,
    variantId,
    billingFrequency,
    billingInterval,
    price,
    currency,
    trialEnabled,
    trialPeriodDays,
    features,
    limits,
    status,
    createdBy: currentUser?.id || null,
    updatedBy: currentUser?.id || null
  });

  await logActivity({
    planId: plan._id,
    action: 'PLAN_CREATED',
    description: `Plan ${code} created`,
    performedBy: currentUser?.id || null,
    metadata: { plan }
  });

  return plan;
};

/** List plans with pagination */
const listPlans = async (params) => {
  const { query, options } = buildListQuery(params);
  const skip = options.skip;
  const [plans, total] = await Promise.all([
    SubscriptionPlan.find(query).sort(options.sort).skip(skip).limit(options.limit),
    SubscriptionPlan.countDocuments(query)
  ]);
  return {
    plans,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit) || 1
    }
  };
};

/** Get plan by id */
const getPlanById = async (id) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new Error('Plan not found');
  return plan;
};

/** Update plan */
const updatePlan = async (id, updates, currentUser) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new Error('Plan not found');
  if (plan.status === 'archived') throw new Error('Cannot modify archived plan');

  // If code changes, ensure uniqueness
  if (updates.code && updates.code !== plan.code) {
    const dup = await SubscriptionPlan.findOne({ code: updates.code });
    if (dup) throw new Error('Plan code already exists');
  }

  // Validate product/variant if changed
  if (updates.productId) await productAdapter.validateProduct(updates.productId);
  if (updates.variantId) await productAdapter.validateVariant(updates.productId || plan.productId, updates.variantId);

  const before = plan.toObject();
  Object.assign(plan, updates, { updatedBy: currentUser?.id || null });
  await plan.save();

  await logActivity({
    planId: plan._id,
    action: 'PLAN_UPDATED',
    description: `Plan ${plan.code} updated`,
    performedBy: currentUser?.id || null,
    metadata: { before, after: plan }
  });

  return plan;
};

/** Change status (active/inactive) */
const changeStatus = async (id, newStatus, currentUser) => {
  const allowed = ['active', 'inactive'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid status');
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new Error('Plan not found');
  if (plan.status === 'archived') throw new Error('Archived plan cannot be reactivated');
  const before = plan.status;
  plan.status = newStatus;
  plan.updatedBy = currentUser?.id || null;
  await plan.save();

  await logActivity({
    planId: plan._id,
    action: 'PLAN_STATUS_CHANGED',
    description: `Status changed from ${before} to ${newStatus}`,
    performedBy: currentUser?.id || null,
    metadata: { before, after: newStatus }
  });
  return plan;
};

/** Archive plan */
const archivePlan = async (id, currentUser) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new Error('Plan not found');
  const before = plan.status;
  plan.status = 'archived';
  plan.updatedBy = currentUser?.id || null;
  await plan.save();
  await logActivity({
    planId: plan._id,
    action: 'PLAN_ARCHIVED',
    description: 'Plan archived',
    performedBy: currentUser?.id || null,
    metadata: { before }
  });
  return plan;
};

/** Get plan activity */
const getPlanActivity = async (planId) => {
  const PlanActivity = require('../models/PlanActivity');
  return PlanActivity.find({ planId }).sort({ createdAt: -1 });
};

/** Get catalog (active plans only) */
const getCatalog = async (filters = {}) => {
  const query = { status: 'active' };
  if (filters.productId) query.productId = filters.productId;
  if (filters.billingFrequency) query.billingFrequency = filters.billingFrequency;
  return SubscriptionPlan.find(query).sort({ price: 1 });
};

/** Get plans for a specific product */
const getPlansByProduct = async (productId) => {
  return SubscriptionPlan.find({ productId }).sort({ createdAt: -1 });
};

module.exports = {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  changeStatus,
  archivePlan,
  getPlanActivity,
  getCatalog,
  getPlansByProduct
};
