import customerAdapter from "../../quotations/adapters/customerAdapter.js";

/**
 * Customer Adapter for Subscription Lifecycle Management (M7)
 * Interfaces with Module M2
 */

export const getCustomers = async () => {
  return await customerAdapter.getCustomers();
};

export const getCustomerById = async (customerId) => {
  return await customerAdapter.getCustomerById(customerId);
};

export const validateCustomer = async (customerId) => {
  return await customerAdapter.validateCustomer(customerId);
};

export default {
  getCustomers,
  getCustomerById,
  validateCustomer
};
