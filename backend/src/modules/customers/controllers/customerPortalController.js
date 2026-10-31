const portalService = require('../services/customerPortalService');
const profileService = require('../services/customerProfileService');
const addressService = require('../services/customerAddressService');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');

const getPortalProfile = async (req, res, next) => {
  try {
    const customer = await profileService.getCustomerByUserId(req.user.id);
    if (!customer) {
      // In standalone dev mode, return safe fallback profile for user
      return sendSuccess(res, 200, 'Customer profile retrieved', {
        customer: {
          id: req.user.id,
          userId: req.user.id,
          displayName: req.user.fullName || 'Customer',
          email: req.user.email,
          customerCode: 'CUST-PORTAL',
          customerType: 'individual',
          status: 'active',
          phone: '',
          billingAddress: null,
          shippingAddress: null
        }
      });
    }
    return sendSuccess(res, 200, 'Customer profile retrieved successfully', { customer });
  } catch (err) {
    next(err);
  }
};

const updatePortalProfile = async (req, res, next) => {
  try {
    const customer = await profileService.updateCustomerProfile(
      req.user.id,
      req.body,
      req.user
    );
    return sendSuccess(res, 200, 'Profile updated successfully', { customer });
  } catch (err) {
    return sendError(res, 400, err.message);
  }
};

const getPortalDashboard = async (req, res, next) => {
  try {
    const dashboardData = await portalService.getDashboardSummary(req.user.id);
    return sendSuccess(res, 200, 'Customer portal dashboard data loaded', dashboardData);
  } catch (err) {
    next(err);
  }
};

const getPortalSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await portalService.getCustomerSubscriptions(req.user.id);
    return sendSuccess(res, 200, 'Customer subscriptions retrieved', { subscriptions });
  } catch (err) {
    next(err);
  }
};

const getPortalQuotations = async (req, res, next) => {
  try {
    const quotations = await portalService.getCustomerQuotations(req.user.id);
    return sendSuccess(res, 200, 'Customer quotations retrieved', { quotations });
  } catch (err) {
    next(err);
  }
};

const getPortalInvoices = async (req, res, next) => {
  try {
    const invoices = await portalService.getCustomerInvoices(req.user.id);
    return sendSuccess(res, 200, 'Customer invoices retrieved', { invoices });
  } catch (err) {
    next(err);
  }
};

const getPortalPayments = async (req, res, next) => {
  try {
    const payments = await portalService.getCustomerPayments(req.user.id);
    return sendSuccess(res, 200, 'Customer payments retrieved', { payments });
  } catch (err) {
    next(err);
  }
};

const getPortalAddresses = async (req, res, next) => {
  try {
    const addresses = await portalService.getCustomerAddresses(req.user.id);
    return sendSuccess(res, 200, 'Customer addresses retrieved', { addresses });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPortalProfile,
  updatePortalProfile,
  getPortalDashboard,
  getPortalSubscriptions,
  getPortalQuotations,
  getPortalInvoices,
  getPortalPayments,
  getPortalAddresses
};
