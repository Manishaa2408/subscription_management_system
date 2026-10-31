/**
 * Customer Adapter for Quotation Management (M6)
 * Simulates Developer 1's Module M2 (Customer Management)
 * Provides customer validation, retrieval, and snapshot generation.
 */

export const SAMPLE_CUSTOMERS = [
  {
    _id: "67246830a3f65e2a84b13001",
    name: "ABC Technologies Pvt Ltd",
    email: "contact@abctech.example.com",
    phone: "+91 9876543210",
    companyName: "ABC Technologies Pvt Ltd",
    billingAddress: {
      street: "Plot 42, Electronics City Phase 1",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560100",
      country: "India"
    },
    status: "active"
  },
  {
    _id: "67246830a3f65e2a84b13002",
    name: "Kochi Infotech Solutions",
    email: "billing@kochitech.example.com",
    phone: "+91 9847012345",
    companyName: "Kochi Infotech Solutions",
    billingAddress: {
      street: "Kakkanad InfoPark Campus",
      city: "Kochi",
      state: "Kerala",
      postalCode: "682042",
      country: "India"
    },
    status: "active"
  },
  {
    _id: "67246830a3f65e2a84b13003",
    name: "Apex Logistics & Supply Chain",
    email: "accounts@apexlogistics.example.com",
    phone: "+91 9123456789",
    companyName: "Apex Logistics & Supply Chain",
    billingAddress: {
      street: "Harbour Road, Willingdon Island",
      city: "Kochi",
      state: "Kerala",
      postalCode: "682003",
      country: "India"
    },
    status: "active"
  },
  {
    _id: "67246830a3f65e2a84b13004",
    name: "BlueSky Digital Media",
    email: "customer@brightloop.local", // Corresponds to dev test customer role!
    phone: "+91 9988776655",
    companyName: "BlueSky Digital Media",
    billingAddress: {
      street: "Mount Road, Anna Salai",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600002",
      country: "India"
    },
    status: "active"
  }
];

export const getCustomers = async () => {
  return SAMPLE_CUSTOMERS.filter(c => c.status === "active");
};

export const getCustomerById = async (customerId) => {
  if (!customerId) return null;
  const strId = customerId.toString();
  return SAMPLE_CUSTOMERS.find(c => c._id.toString() === strId) || null;
};

export const validateCustomer = async (customerId) => {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return { valid: false, message: `Customer with ID '${customerId}' not found` };
  }
  if (customer.status !== "active") {
    return { valid: false, message: `Customer '${customer.name}' is inactive` };
  }
  return { valid: true, customer };
};

export default {
  getCustomers,
  getCustomerById,
  validateCustomer
};
