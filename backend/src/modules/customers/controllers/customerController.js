const customerService = require('../services/customerService');
const { getCustomerActivities } = require('../services/customerActivityService');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user);
    return sendSuccess(res, 201, 'Customer profile created successfully', { customer });
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already linked')) {
      return sendError(res, 409, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getCustomers(req.query);
    return sendSuccess(res, 200, 'Customers retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req.user);
    return sendSuccess(res, 200, 'Customer retrieved successfully', { customer });
  } catch (err) {
    if (err.message.includes('Access denied')) {
      return sendError(res, 403, err.message);
    }
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Customer profile updated successfully', { customer });
  } catch (err) {
    if (err.message.includes('Access denied')) {
      return sendError(res, 403, err.message);
    }
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const updateCustomerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 400, 'Status is required');
    }
    const customer = await customerService.updateCustomerStatus(req.params.id, status, req.user);
    return sendSuccess(res, 200, `Customer status updated to '${status}' successfully`, { customer });
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const getCustomerActivity = async (req, res, next) => {
  try {
    const activities = await getCustomerActivities(req.params.id);
    return sendSuccess(res, 200, 'Customer activity history retrieved', { activities });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  getCustomerActivity
};
