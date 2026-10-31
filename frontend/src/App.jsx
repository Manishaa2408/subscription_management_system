import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// ── M9 – Recurring Billing & Invoice Generation Engine ──
import BillingDashboard from './modules/billing/pages/BillingDashboard';
import BillingScheduleList from './modules/billing/pages/BillingScheduleList';
import BillingScheduleDetails from './modules/billing/pages/BillingScheduleDetails';
import BillingRuns from './modules/billing/pages/BillingRuns';
import BillingRunDetails from './modules/billing/pages/BillingRunDetails';
import FailedBillings from './modules/billing/pages/FailedBillings';
import BillingHistory from './modules/billing/pages/BillingHistory';

// ── M10 – Invoice & Tax Management ──
import { InvoiceList } from './modules/invoices/pages/InvoiceList';
import { InvoiceDetails } from './modules/invoices/pages/InvoiceDetails';
import { CreateInvoice } from './modules/invoices/pages/CreateInvoice';
import { EditInvoice } from './modules/invoices/pages/EditInvoice';
import { CustomerInvoices } from './modules/invoices/pages/CustomerInvoices';
import { InvoicePrintView } from './modules/invoices/pages/InvoicePrintView';
import { TaxConfigurationList } from './modules/tax/pages/TaxConfigurationList';

// ── M11 – Payment & Reconciliation Management ──
import PaymentList from './modules/payments/pages/PaymentList';
import RecordPayment from './modules/payments/pages/RecordPayment';
import PaymentDetails from './modules/payments/pages/PaymentDetails';
import PaymentReceipt from './modules/payments/pages/PaymentReceipt';
import CustomerPaymentHistory from './modules/payments/pages/CustomerPaymentHistory';
import ReconciliationDashboard from './modules/reconciliation/pages/ReconciliationDashboard';
import RefundList from './modules/refunds/pages/RefundList';

// ── M12 – Dashboard & Analytics ──
import AdminDashboard from './modules/analytics/pages/AdminDashboard';
import RevenueAnalytics from './modules/analytics/pages/RevenueAnalytics';
import CustomerAnalytics from './modules/analytics/pages/CustomerAnalytics';
import SubscriptionAnalytics from './modules/analytics/pages/SubscriptionAnalytics';
import ProductAnalytics from './modules/analytics/pages/ProductAnalytics';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

              {/* ── M12: Dashboard & Analytics ── */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/analytics/revenue" element={<RevenueAnalytics />} />
              <Route path="/admin/analytics/customers" element={<CustomerAnalytics />} />
              <Route path="/admin/analytics/subscriptions" element={<SubscriptionAnalytics />} />
              <Route path="/admin/analytics/products" element={<ProductAnalytics />} />

              {/* ── M9: Recurring Billing & Invoice Generation Engine ── */}
              <Route path="/admin/billing" element={<BillingDashboard />} />
              <Route path="/admin/billing/schedules" element={<BillingScheduleList />} />
              <Route path="/admin/billing/schedules/:id" element={<BillingScheduleDetails />} />
              <Route path="/admin/billing/runs" element={<BillingRuns />} />
              <Route path="/admin/billing/runs/:id" element={<BillingRunDetails />} />
              <Route path="/admin/billing/failed" element={<FailedBillings />} />
              <Route path="/admin/billing/history" element={<BillingHistory />} />

              {/* ── M10: Invoice & Tax Management ── */}
              <Route path="/admin/invoices" element={<InvoiceList />} />
              <Route path="/admin/invoices/create" element={<CreateInvoice />} />
              <Route path="/admin/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/admin/invoices/:id/edit" element={<EditInvoice />} />
              <Route path="/admin/tax-configurations" element={<TaxConfigurationList />} />
              <Route path="/customer/invoices" element={<CustomerInvoices />} />
              <Route path="/invoices/:id/print" element={<InvoicePrintView />} />

              {/* ── M11: Payment & Reconciliation Management ── */}
              <Route path="/admin/payments" element={<PaymentList />} />
              <Route path="/admin/payments/create" element={<RecordPayment />} />
              <Route path="/admin/payments/:id" element={<PaymentDetails />} />
              <Route path="/admin/payments/receipt/:id" element={<PaymentReceipt />} />
              <Route path="/admin/reconciliation" element={<ReconciliationDashboard />} />
              <Route path="/admin/refunds" element={<RefundList />} />
              <Route path="/admin/refunds/create" element={<RefundList />} />
              <Route path="/customer/payments" element={<CustomerPaymentHistory />} />
              <Route path="/customer/payments/:id" element={<PaymentDetails />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
