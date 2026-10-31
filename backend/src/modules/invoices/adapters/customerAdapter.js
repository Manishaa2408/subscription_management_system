/**
 * M10 Temporary Customer Adapter
 * 
 * Standalone development adapter to decouple M10 from Developer 1's M2 Customer Management module.
 * Exposes: getCustomerById, getCustomerDetails, getCustomerBillingAddress, validateCustomer,
 *          getCustomerState, getCustomerGSTIN, getAllCustomers.
 * 
 * In final integration, replace this with Developer 1's M2 customer service:
 *   const customerService = require('../../customers/services/customerService');
 */

const SEED_CUSTOMERS = [
  {
    id: 'cust_001_intra_kerala',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com',
    phone: '+91 484 242 1100',
    gstin: '32AABCK9876C1Z1', // Kerala GSTIN starts with 32
    state: 'Kerala',
    billingAddress: {
      line1: 'Building 4B, Infopark Kochi',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682042',
      country: 'India'
    },
    status: 'active'
  },
  {
    id: 'cust_002_inter_bengaluru',
    name: 'Bengaluru Cloud Systems LLP',
    email: 'accounts@bengalurucloud.io',
    phone: '+91 80 4111 2233',
    gstin: '29ABCDE1234F1Z5', // Karnataka GSTIN starts with 29
    state: 'Karnataka',
    billingAddress: {
      line1: '12th Main Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India'
    },
    status: 'active'
  },
  {
    id: 'cust_003_inter_chennai',
    name: 'Chennai Retail Solutions',
    email: 'billing@chennairetail.in',
    phone: '+91 44 2828 9000',
    gstin: '33AABCT4321E1Z9', // Tamil Nadu GSTIN starts with 33
    state: 'Tamil Nadu',
    billingAddress: {
      line1: 'Anna Salai, Teynampet',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600018',
      country: 'India'
    },
    status: 'active'
  },
  {
    id: 'cust_004_intra_consumer',
    name: 'Arun Kumar (Individual Consumer)',
    email: 'arun.kerala@example.com',
    phone: '+91 98470 12345',
    gstin: '', // Unregistered consumer
    state: 'Kerala',
    billingAddress: {
      line1: 'MG Road, Jos Junction',
      city: 'Ernakulam',
      state: 'Kerala',
      postalCode: '682016',
      country: 'India'
    },
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

const getCustomerBillingAddress = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return customer ? customer.billingAddress : null;
};

const validateCustomer = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return Boolean(customer && customer.status === 'active');
};

const getCustomerState = async (customerId) => {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;
  return customer.state || (customer.billingAddress && customer.billingAddress.state) || null;
};

const getCustomerGSTIN = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return customer ? customer.gstin : null;
};

const getAllCustomers = async () => {
  return [...SEED_CUSTOMERS];
};

module.exports = {
  getCustomerById,
  getCustomerDetails,
  getCustomerBillingAddress,
  validateCustomer,
  getCustomerState,
  getCustomerGSTIN,
  getAllCustomers,
  SEED_CUSTOMERS
};
