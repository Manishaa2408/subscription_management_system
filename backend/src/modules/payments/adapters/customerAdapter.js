/**
 * M11 Temporary Customer Adapter
 * 
 * Standalone development adapter to decouple M11 from Developer 1's M2 Customer module.
 * In final integration, replace this with Developer 1's M2 customer service:
 *   const customerService = require('../../customers/services/customerService');
 */

const SEED_CUSTOMERS = [
  {
    id: 'cust_001_intra_kerala',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com',
    phone: '+91 484 242 1100',
    state: 'Kerala',
    status: 'active'
  },
  {
    id: 'cust_002_inter_bengaluru',
    name: 'Bengaluru Cloud Systems LLP',
    email: 'accounts@bengalurucloud.io',
    phone: '+91 80 4111 2233',
    state: 'Karnataka',
    status: 'active'
  },
  {
    id: 'cust_003_inter_chennai',
    name: 'Chennai Retail Solutions',
    email: 'billing@chennairetail.in',
    phone: '+91 44 2828 9000',
    state: 'Tamil Nadu',
    status: 'active'
  },
  {
    id: 'cust_004_intra_consumer',
    name: 'Arun Kumar (Individual Consumer)',
    email: 'arun.kerala@example.com',
    phone: '+91 98470 12345',
    state: 'Kerala',
    status: 'active'
  }
];

const getCustomerById = async (customerId) => {
  if (!customerId) return null;
  const idStr = customerId.toString();
  return SEED_CUSTOMERS.find(c => c.id === idStr || c._id === idStr) || null;
};

const getCustomerDetails = async (customerId) => {
  return getCustomerById(customerId);
};

const validateCustomer = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return Boolean(customer && customer.status === 'active');
};

const getCustomerEmail = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return customer ? customer.email : null;
};

const getCustomerName = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return customer ? customer.name : null;
};

const getAllCustomers = async () => {
  return [...SEED_CUSTOMERS];
};

module.exports = {
  getCustomerById,
  getCustomerDetails,
  validateCustomer,
  getCustomerEmail,
  getCustomerName,
  getAllCustomers,
  SEED_CUSTOMERS
};
