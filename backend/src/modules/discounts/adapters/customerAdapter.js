import customerAdapter from "../../quotations/adapters/customerAdapter.js";
import DiscountUsage from "../models/DiscountUsage.js";

/**
 * Customer Adapter for Discount Management (M8)
 * Interfaces with Module M2 (Customer Management)
 */

export const getAllCustomers = async () => {
  return await customerAdapter.getCustomers();
};

export const getCustomerById = async (customerId) => {
  return await customerAdapter.getCustomerById(customerId);
};

export const isNewCustomer = async (customerId) => {
  if (!customerId) return false;
  // A customer is considered new if they haven't redeemed any discounts before
  const count = await DiscountUsage.countDocuments({
    customerId,
    status: "redeemed"
  });
  return count === 0;
};

export const getCustomerDiscountHistory = async (customerId) => {
  if (!customerId) return [];
  return await DiscountUsage.find({ customerId }).sort({ createdAt: -1 });
};

export default {
  getAllCustomers,
  getCustomerById,
  isNewCustomer,
  getCustomerDiscountHistory
};
