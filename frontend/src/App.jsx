import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { InvoiceList } from './modules/invoices/pages/InvoiceList';
import { InvoiceDetails } from './modules/invoices/pages/InvoiceDetails';
import { CreateInvoice } from './modules/invoices/pages/CreateInvoice';
import { EditInvoice } from './modules/invoices/pages/EditInvoice';
import { CustomerInvoices } from './modules/invoices/pages/CustomerInvoices';
import { InvoicePrintView } from './modules/invoices/pages/InvoicePrintView';
import { TaxConfigurationList } from './modules/tax/pages/TaxConfigurationList';

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

              {/* Admin & Staff Invoices */}
              <Route path="/admin/invoices" element={<InvoiceList />} />
              <Route path="/admin/invoices/create" element={<CreateInvoice />} />
              <Route path="/admin/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/admin/invoices/:id/edit" element={<EditInvoice />} />

              {/* Tax Configurations */}
              <Route path="/admin/tax-configurations" element={<TaxConfigurationList />} />

              {/* Customer Portal */}
              <Route path="/customer/invoices" element={<CustomerInvoices />} />

              {/* Print View (Standalone clean sheet) */}
              <Route path="/invoices/:id/print" element={<InvoicePrintView />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/admin/invoices" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
