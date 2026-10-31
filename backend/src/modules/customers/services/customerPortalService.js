const { getCustomerByUserId } = require('./customerProfileService');
const { getCustomerActivities } = require('./customerActivityService');
const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const quotationAdapter = require('../adapters/quotationAdapter');
const invoiceAdapter = require('../adapters/invoiceAdapter');
const paymentAdapter = require('../adapters/paymentAdapter');
const userAdapter = require('../adapters/userAdapter');

/**
 * Aggregates complete dashboard data for the customer portal
 */
const getDashboardSummary = async (userId) => {
  let customer = await getCustomerByUserId(userId);

  // If customer doesn't exist yet for this user in standalone mode, create a virtual profile
  if (!customer) {
    const user = await userAdapter.getUserById(userId);
    customer = {
      _id: userId,
      id: userId,
      displayName: user?.fullName || 'Customer',
      email: user?.email || 'customer@brightloop.com',
      customerCode: 'CUST-PORTAL',
      customerType: 'individual',
      status: 'active',
      phone: ''
    };
  }

  const customerId = customer._id || customer.id;

  const [
    activeSubsCount,
    subscriptions,
    quotations,
    invoices,
    payments,
    invoiceSummary,
    recentActivity
  ] = await Promise.all([
    subscriptionAdapter.getActiveSubscriptionCount(customerId),
    subscriptionAdapter.getCustomerSubscriptions(customerId),
    quotationAdapter.getCustomerQuotations(customerId),
    invoiceAdapter.getCustomerInvoices(customerId),
    paymentAdapter.getCustomerPayments(customerId),
    invoiceAdapter.getInvoiceSummary(customerId),
    getCustomerActivities(customerId, 5)
  ]);

  return {
    customer: customer.toJSON ? customer.toJSON() : customer,
    stats: {
      activeSubscriptions: activeSubsCount,
      totalInvoices: invoiceSummary.totalInvoices,
      totalOutstandingBalance: invoiceSummary.totalOutstanding,
      totalPaidAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    },
    recentSubscriptions: subscriptions.slice(0, 3),
    recentQuotations: quotations.slice(0, 3),
    recentInvoices: invoices.slice(0, 3),
    recentPayments: payments.slice(0, 3),
    recentActivity
  };
};

const getCustomerSubscriptions = async (userId) => {
  const customer = await getCustomerByUserId(userId);
  const customerId = customer ? customer._id : userId;
  return await subscriptionAdapter.getCustomerSubscriptions(customerId);
};

const getCustomerQuotations = async (userId) => {
  const customer = await getCustomerByUserId(userId);
  const customerId = customer ? customer._id : userId;
  return await quotationAdapter.getCustomerQuotations(customerId);
};

const getCustomerInvoices = async (userId) => {
  const customer = await getCustomerByUserId(userId);
  const customerId = customer ? customer._id : userId;
  return await invoiceAdapter.getCustomerInvoices(customerId);
};

const getCustomerPayments = async (userId) => {
  const customer = await getCustomerByUserId(userId);
  const customerId = customer ? customer._id : userId;
  return await paymentAdapter.getCustomerPayments(customerId);
};

const getCustomerAddresses = async (userId) => {
  const customer = await getCustomerByUserId(userId);
  if (!customer) return [];
  return customer.addresses || [];
};

module.exports = {
  getDashboardSummary,
  getCustomerSubscriptions,
  getCustomerQuotations,
  getCustomerInvoices,
  getCustomerPayments,
  getCustomerAddresses
};
