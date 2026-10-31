import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// M10 – Invoice & Tax Management
import { InvoiceList } from './modules/invoices/pages/InvoiceList';
import { InvoiceDetails } from './modules/invoices/pages/InvoiceDetails';
import { CreateInvoice } from './modules/invoices/pages/CreateInvoice';
import { EditInvoice } from './modules/invoices/pages/EditInvoice';
import { CustomerInvoices } from './modules/invoices/pages/CustomerInvoices';
import { InvoicePrintView } from './modules/invoices/pages/InvoicePrintView';
import { TaxConfigurationList } from './modules/tax/pages/TaxConfigurationList';

// M11 – Payment & Reconciliation Management
import PaymentList from './modules/payments/pages/PaymentList';
import RecordPayment from './modules/payments/pages/RecordPayment';
import PaymentDetails from './modules/payments/pages/PaymentDetails';
import PaymentReceipt from './modules/payments/pages/PaymentReceipt';
import CustomerPaymentHistory from './modules/payments/pages/CustomerPaymentHistory';
import ReconciliationDashboard from './modules/reconciliation/pages/ReconciliationDashboard';
import RefundList from './modules/refunds/pages/RefundList';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/admin/invoices" replace />} />

              {/* ── M10: Invoice & Tax Management ── */}
              {/* Admin & Staff Invoices */}
              <Route path="/admin/invoices" element={<InvoiceList />} />
              <Route path="/admin/invoices/create" element={<CreateInvoice />} />
              <Route path="/admin/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/admin/invoices/:id/edit" element={<EditInvoice />} />

              {/* Tax Configurations */}
              <Route path="/admin/tax-configurations" element={<TaxConfigurationList />} />

              {/* Customer Invoice Portal */}
              <Route path="/customer/invoices" element={<CustomerInvoices />} />

              {/* Print View (Standalone clean sheet) */}
              <Route path="/invoices/:id/print" element={<InvoicePrintView />} />

              {/* ── M11: Payment & Reconciliation Management ── */}
              {/* Admin/Staff Payments */}
              <Route path="/admin/payments" element={<PaymentList />} />
              <Route path="/admin/payments/create" element={<RecordPayment />} />
              <Route path="/admin/payments/:id" element={<PaymentDetails />} />
              <Route path="/admin/payments/receipt/:id" element={<PaymentReceipt />} />

              {/* Reconciliation */}
              <Route path="/admin/reconciliation" element={<ReconciliationDashboard />} />

              {/* Refunds */}
              <Route path="/admin/refunds" element={<RefundList />} />
              <Route path="/admin/refunds/create" element={<RefundList />} />

              {/* Customer Payment Portal */}
              <Route path="/customer/payments" element={<CustomerPaymentHistory />} />
              <Route path="/customer/payments/:id" element={<PaymentDetails />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/admin/invoices" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
