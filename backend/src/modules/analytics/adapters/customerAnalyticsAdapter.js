/**
 * M12 Customer Analytics Adapter
 * Decouples M12 from M2 (Customer Management).
 */

const SEED_CUSTOMERS = [
  {
    customerId: 'cust_001_intra_kerala',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com',
    customerType: 'business',
    state: 'Kerala',
    status: 'active',
    registeredAt: new Date('2026-01-15T10:00:00Z')
  },
  {
    customerId: 'cust_002_inter_bengaluru',
    name: 'Bengaluru Cloud Systems LLP',
    email: 'accounts@bengalurucloud.io',
    customerType: 'business',
    state: 'Karnataka',
    status: 'active',
    registeredAt: new Date('2026-02-10T11:30:00Z')
  },
  {
    customerId: 'cust_003_inter_chennai',
    name: 'Chennai Fintech Solutions',
    email: 'billing@chennaifintech.in',
    customerType: 'business',
    state: 'Tamil Nadu',
    status: 'active',
    registeredAt: new Date('2026-03-05T09:15:00Z')
  },
  {
    customerId: 'cust_004_individual',
    name: 'Arun Varma',
    email: 'arun.varma@gmail.com',
    customerType: 'individual',
    state: 'Kerala',
    status: 'active',
    registeredAt: new Date('2026-04-20T14:00:00Z')
  },
  {
    customerId: 'cust_005_mumbai_ent',
    name: 'Mumbai Digital Ventures',
    email: 'contact@mumbaidigital.in',
    customerType: 'business',
    state: 'Maharashtra',
    status: 'active',
    registeredAt: new Date('2026-06-12T16:45:00Z')
  },
  {
    customerId: 'cust_006_inactive_user',
    name: 'Devika Sharma',
    email: 'devika.s@outlook.com',
    customerType: 'individual',
    state: 'Delhi',
    status: 'inactive',
    registeredAt: new Date('2026-07-01T12:00:00Z')
  }
];

const getAllCustomers = async (filters = {}) => {
  let list = [...SEED_CUSTOMERS];
  if (filters.status) list = list.filter((c) => c.status === filters.status);
  if (filters.customerType) list = list.filter((c) => c.customerType === filters.customerType);
  return list;
};

const getCustomerById = async (customerId) => {
  return SEED_CUSTOMERS.find((c) => c.customerId === customerId) || null;
};

const getCustomerCount = async (filters = {}) => {
  const list = await getAllCustomers(filters);
  return list.length;
};

const getNewCustomerCount = async (dateRange = {}) => {
  const { startDate, endDate } = dateRange;
  return SEED_CUSTOMERS.filter((c) => {
    if (startDate && new Date(c.registeredAt) < new Date(startDate)) return false;
    if (endDate && new Date(c.registeredAt) > new Date(endDate)) return false;
    return true;
  }).length;
};

const getCustomerStatusBreakdown = async () => {
  const breakdown = { active: 0, inactive: 0 };
  SEED_CUSTOMERS.forEach((c) => {
    breakdown[c.status] = (breakdown[c.status] || 0) + 1;
  });
  return breakdown;
};

const getCustomerTypeBreakdown = async () => {
  const breakdown = { business: 0, individual: 0 };
  SEED_CUSTOMERS.forEach((c) => {
    breakdown[c.customerType] = (breakdown[c.customerType] || 0) + 1;
  });
  return breakdown;
};

const getCustomerGrowth = async (dateRange = {}) => {
  // Aggregate registrations by month for timeline chart
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
  const monthMap = {};
  months.forEach((m) => { monthMap[m] = 0; });

  SEED_CUSTOMERS.forEach((c) => {
    const d = new Date(c.registeredAt);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (monthMap[key] !== undefined) {
      monthMap[key] += 1;
    }
  });

  let runningTotal = 0;
  return Object.entries(monthMap).map(([period, newCustomers]) => {
    runningTotal += newCustomers;
    return {
      period,
      newCustomers,
      totalCustomers: runningTotal
    };
  });
};

module.exports = {
  SEED_CUSTOMERS,
  getAllCustomers,
  getCustomerById,
  getCustomerCount,
  getNewCustomerCount,
  getCustomerStatusBreakdown,
  getCustomerTypeBreakdown,
  getCustomerGrowth
};
