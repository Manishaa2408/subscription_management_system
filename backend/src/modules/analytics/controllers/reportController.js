const {
  exportRevenueReport,
  exportCustomerReport,
  exportSubscriptionReport,
  exportInvoiceReport,
  exportPaymentReport,
  getReportHistory
} = require('../services/reportExportService');

const sendCSV = (res, csv, filename) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};

const exportRevenue = async (req, res, next) => {
  try {
    const user = req.user ? req.user.email : 'admin';
    const { csv, filename } = await exportRevenueReport(user);
    sendCSV(res, csv, filename);
  } catch (err) { next(err); }
};

const exportCustomers = async (req, res, next) => {
  try {
    const user = req.user ? req.user.email : 'admin';
    const { csv, filename } = await exportCustomerReport(user);
    sendCSV(res, csv, filename);
  } catch (err) { next(err); }
};

const exportSubscriptions = async (req, res, next) => {
  try {
    const user = req.user ? req.user.email : 'admin';
    const { csv, filename } = await exportSubscriptionReport(user);
    sendCSV(res, csv, filename);
  } catch (err) { next(err); }
};

const exportInvoices = async (req, res, next) => {
  try {
    const user = req.user ? req.user.email : 'admin';
    const { csv, filename } = await exportInvoiceReport(user);
    sendCSV(res, csv, filename);
  } catch (err) { next(err); }
};

const exportPayments = async (req, res, next) => {
  try {
    const user = req.user ? req.user.email : 'admin';
    const { csv, filename } = await exportPaymentReport(user);
    sendCSV(res, csv, filename);
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await getReportHistory();
    res.status(200).json({ success: true, data: history });
  } catch (err) { next(err); }
};

module.exports = {
  exportRevenue,
  exportCustomers,
  exportSubscriptions,
  exportInvoices,
  exportPayments,
  getHistory
};
