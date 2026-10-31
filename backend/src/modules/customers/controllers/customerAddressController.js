const addressService = require('../services/customerAddressService');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');

const checkCustomerAccess = async (customerId, currentUser) => {
  if (currentUser.role === 'admin' || currentUser.role === 'staff') {
    return true;
  }
  const customer = await Customer.findById(customerId);
  if (!customer) return false;
  return customer.userId && String(customer.userId) === String(currentUser.id);
};

const getAddresses = async (req, res, next) => {
  try {
    const hasAccess = await checkCustomerAccess(req.params.id, req.user);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied: You cannot view this address list');
    }

    const addresses = await addressService.getAddresses(req.params.id);
    return sendSuccess(res, 200, 'Addresses retrieved successfully', { addresses });
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const hasAccess = await checkCustomerAccess(req.params.id, req.user);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied: You cannot add an address for this customer');
    }

    const address = await addressService.addAddress(req.params.id, req.body, req.user);
    return sendSuccess(res, 201, 'Address added successfully', { address });
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const hasAccess = await checkCustomerAccess(req.params.id, req.user);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied: You cannot update this address');
    }

    const address = await addressService.updateAddress(
      req.params.id,
      req.params.addressId,
      req.body,
      req.user
    );
    return sendSuccess(res, 200, 'Address updated successfully', { address });
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const hasAccess = await checkCustomerAccess(req.params.id, req.user);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied');
    }

    const address = await addressService.setDefaultAddress(
      req.params.id,
      req.params.addressId,
      req.user
    );
    return sendSuccess(res, 200, 'Default address updated successfully', { address });
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const hasAccess = await checkCustomerAccess(req.params.id, req.user);
    if (!hasAccess) {
      return sendError(res, 403, 'Access denied');
    }

    await addressService.deleteAddress(req.params.id, req.params.addressId, req.user);
    return sendSuccess(res, 200, 'Address deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
