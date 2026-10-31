const AnalyticsReport = require('../models/AnalyticsReport');
const customerAdapter = require('../adapters/customerAnalyticsAdapter');
const subscriptionAdapter = require('../adapters/subscriptionAnalyticsAdapter');
const invoiceAdapter = require('../adapters/invoiceAnalyticsAdapter');
const paymentAdapter = require('../adapters/paymentAnalyticsAdapter');

/**
 * Converts array of flat objects to CSV formatted string
 */
const toCSV = (rows, headers) => {
  if (!rows || rows.length === 0) {
    return headers.join(',') + '\n';
  }

  const headerLine = headers.join(',');
  const rowLines = rows.map((r) =>
    headers
      .map((h) => {
        const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
        // Escape quotes
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headerLine, ...rowLines].join('\n');
};

const exportRevenueReport = async (user = 'admin') => {
  const trends = await paymentAdapter.getPaymentTrends();
  const headers = ['period', 'collected', 'refunds', 'net'];
  const csv = toCSV(trends, headers);

  await AnalyticsReport.create({
    reportName: `Revenue_Report_${new Date().toISOString().slice(0, 10)}`,
    reportType: 'revenue',
    generatedBy: user,
    recordCount: trends.length,
    status: 'completed'
  });

  return { csv, filename: `revenue_report_${Date.now()}.csv` };
};

const exportCustomerReport = async (user = 'admin') => {
  const customers = await customerAdapter.getAllCustomers();
  const formatted = customers.map((c) => ({
    customerId: c.customerId,
    name: c.name,
    email: c.email,
    customerType: c.customerType,
    state: c.state,
    status: c.status,
    registeredAt: c.registeredAt ? new Date(c.registeredAt).toISOString() : ''
  }));

  const headers = ['customerId', 'name', 'email', 'customerType', 'state', 'status', 'registeredAt'];
  const csv = toCSV(formatted, headers);

  await AnalyticsReport.create({
    reportName: `Customer_Report_${new Date().toISOString().slice(0, 10)}`,
    reportType: 'customers',
    generatedBy: user,
    recordCount: formatted.length,
    status: 'completed'
  });

  return { csv, filename: `customer_report_${Date.now()}.csv` };
};

const exportSubscriptionReport = async (user = 'admin') => {
  const subs = await subscriptionAdapter.getSubscriptions();
  const formatted = subs.map((s) => ({
    subscriptionId: s.subscriptionId,
    subscriptionNumber: s.subscriptionNumber,
    customerId: s.customerId,
    planId: s.planId,
    status: s.status,
    mrr: s.mrr,
    startDate: s.startDate ? new Date(s.startDate).toISOString() : ''
  }));

  const headers = ['subscriptionId', 'subscriptionNumber', 'customerId', 'planId', 'status', 'mrr', 'startDate'];
  const csv = toCSV(formatted, headers);

  await AnalyticsReport.create({
    reportName: `Subscription_Report_${new Date().toISOString().slice(0, 10)}`,
    reportType: 'subscriptions',
    generatedBy: user,
    recordCount: formatted.length,
    status: 'completed'
  });

  return { csv, filename: `subscription_report_${Date.now()}.csv` };
};

const exportInvoiceReport = async (user = 'admin') => {
  const invData = await invoiceAdapter.getInvoiceRevenueSummary();
  const rows = invoiceAdapter.FALLBACK_INVOICES || [];
  const formatted = rows.map((i) => ({
    invoiceNumber: i.invoiceNumber,
    customerId: i.customerId,
    grandTotal: i.grandTotal,
    amountPaid: i.amountPaid,
    outstandingAmount: i.outstandingAmount,
    status: i.status
  }));

  const headers = ['invoiceNumber', 'customerId', 'grandTotal', 'amountPaid', 'outstandingAmount', 'status'];
  const csv = toCSV(formatted, headers);

  await AnalyticsReport.create({
    reportName: `Invoice_Report_${new Date().toISOString().slice(0, 10)}`,
    reportType: 'invoices',
    generatedBy: user,
    recordCount: formatted.length,
    status: 'completed'
  });

  return { csv, filename: `invoice_report_${Date.now()}.csv` };
};

const exportPaymentReport = async (user = 'admin') => {
  const rows = paymentAdapter.FALLBACK_PAYMENTS || [];
  const formatted = rows.map((p, idx) => ({
    paymentId: `PAY-${idx + 1}`,
    amount: p.amount,
    paymentMethod: p.paymentMethod,
    status: p.status,
    paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : ''
  }));

  const headers = ['paymentId', 'amount', 'paymentMethod', 'status', 'paidAt'];
  const csv = toCSV(formatted, headers);

  await AnalyticsReport.create({
    reportName: `Payment_Report_${new Date().toISOString().slice(0, 10)}`,
    reportType: 'payments',
    generatedBy: user,
    recordCount: formatted.length,
    status: 'completed'
  });

  return { csv, filename: `payment_report_${Date.now()}.csv` };
};

const getReportHistory = async () => {
  return await AnalyticsReport.find().sort({ generatedAt: -1 }).limit(20);
};

module.exports = {
  exportRevenueReport,
  exportCustomerReport,
  exportSubscriptionReport,
  exportInvoiceReport,
  exportPaymentReport,
  getReportHistory
};
