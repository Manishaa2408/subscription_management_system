/**
 * M9 Customer Adapter
 * Standalone development adapter to decouple M9 from M2 (Customer Management).
 */

const SEED_CUSTOMERS = [
  {
    id: 'cust_001_intra_kerala',
    customerId: 'cust_001_intra_kerala',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com',
    phone: '+91 484 242 1100',
    billingAddress: {
      line1: 'Infopark Phase 2, Carnival Infopark',
      line2: 'Kakkanad',
      city: 'Kochi',
      state: 'Kerala',
      stateCode: '32',
      pincode: '682042',
      country: 'India'
    },
    status: 'active',
    gstin: '32AABCK9999K1Z4'
  },
  {
    id: 'cust_002_inter_bengaluru',
    customerId: 'cust_002_inter_bengaluru',
    name: 'Bengaluru Cloud Systems LLP',
    email: 'accounts@bengalurucloud.io',
    phone: '+91 80 4111 2233',
    billingAddress: {
      line1: '7th Block, Koramangala',
      line2: '100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560095',
      country: 'India'
    },
    status: 'active',
    gstin: '29AAFCB5555M1Z8'
  },
  {
    id: 'cust_003_inter_chennai',
    customerId: 'cust_003_inter_chennai',
    name: 'Chennai Fintech Solutions',
    email: 'billing@chennaifintech.in',
    phone: '+91 44 2828 7700',
    billingAddress: {
      line1: 'OMR Road, Sholinganallur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '600119',
      country: 'India'
    },
    status: 'active',
    gstin: '33AAHCC8888P1Z2'
  },
  {
    id: 'cust_004_individual',
    customerId: 'cust_004_individual',
    name: 'Arun Varma (B2C)',
    email: 'arun.varma@gmail.com',
    phone: '+91 98950 12345',
    billingAddress: {
      line1: 'Flat 4B, Sky Towers, Marine Drive',
      city: 'Kochi',
      state: 'Kerala',
      stateCode: '32',
      pincode: '682031',
      country: 'India'
    },
    status: 'active',
    gstin: null
  }
];

const getCustomerById = async (customerId) => {
  if (!customerId) return null;
  return SEED_CUSTOMERS.find((c) => c.id === customerId || c.customerId === customerId) || null;
};

const getCustomerDetails = async (customerId) => {
  return await getCustomerById(customerId);
};

const getCustomerBillingAddress = async (customerId) => {
  const customer = await getCustomerById(customerId);
  return customer ? customer.billingAddress : null;
};

const validateCustomer = async (customerId) => {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return { valid: false, reason: `Customer '${customerId}' not found in registry` };
  }
  if (customer.status !== 'active') {
    return { valid: false, reason: `Customer '${customerId}' account is ${customer.status}` };
  }
  return { valid: true, customer };
};

module.exports = {
  SEED_CUSTOMERS,
  getCustomerById,
  getCustomerDetails,
  getCustomerBillingAddress,
  validateCustomer
};
