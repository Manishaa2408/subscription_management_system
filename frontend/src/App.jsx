import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// ── M1: Auth & User Management Pages ──
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import UserManagement from './pages/admin/UserManagement';
import StaffDashboard from './pages/staff/StaffDashboard';
import Unauthorized from './pages/Unauthorized';

// ── M2: Customer Management & Portal Pages ──
import CustomerList from './pages/admin/CustomerList';
import CustomerDetails from './pages/admin/CustomerDetails';
import CreateCustomer from './pages/admin/CreateCustomer';
import EditCustomer from './pages/admin/EditCustomer';
import CustomerPortalDashboard from './pages/customer/CustomerPortalDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAddresses from './pages/customer/CustomerAddresses';

// ── M3 & M4: Products & Subscription Plans ──
import PlanDashboard from './pages/admin/PlanDashboard';
import PlanCreate from './pages/admin/PlanCreate';
import PlanEdit from './pages/admin/PlanEdit';

// ── M5: Quotation Template Management ──
import TemplateList from './pages/quotationTemplates/TemplateList';
import CreateTemplate from './pages/quotationTemplates/CreateTemplate';
import TemplateDetails from './pages/quotationTemplates/TemplateDetails';
import EditTemplate from './pages/quotationTemplates/EditTemplate';

// ── M6: Quotation Management ──
import QuotationDashboard from './pages/quotations/QuotationDashboard';
import CreateQuotation from './pages/quotations/CreateQuotation';
import QuotationDetails from './pages/quotations/QuotationDetails';
import EditQuotation from './pages/quotations/EditQuotation';
import QuotationCustomerPortal from './pages/quotations/CustomerPortal';

// ── M7: Subscription Lifecycle Management ──
import SubscriptionDashboard from './pages/subscriptions/SubscriptionDashboard';
import CreateSubscription from './pages/subscriptions/CreateSubscription';
import SubscriptionDetails from './pages/subscriptions/SubscriptionDetails';
import CustomerSubscriptions from './pages/subscriptions/CustomerSubscriptions';

// ── M8: Discount Management ──
import DiscountDashboard from './pages/discounts/DiscountDashboard';
import CreateDiscount from './pages/discounts/CreateDiscount';
import EditDiscount from './pages/discounts/EditDiscount';
import DiscountDetails from './pages/discounts/DiscountDetails';
import DiscountTester from './pages/discounts/DiscountTester';

// ── M9: Recurring Billing & Invoice Generation Engine ──
import BillingDashboard from './modules/billing/pages/BillingDashboard';
import BillingScheduleList from './modules/billing/pages/BillingScheduleList';
import BillingScheduleDetails from './modules/billing/pages/BillingScheduleDetails';
import BillingRuns from './modules/billing/pages/BillingRuns';
import BillingRunDetails from './modules/billing/pages/BillingRunDetails';
import FailedBillings from './modules/billing/pages/FailedBillings';
import BillingHistory from './modules/billing/pages/BillingHistory';

// ── M10: Invoice & Tax Management ──
import { InvoiceList } from './modules/invoices/pages/InvoiceList';
import { InvoiceDetails } from './modules/invoices/pages/InvoiceDetails';
import { CreateInvoice } from './modules/invoices/pages/CreateInvoice';
import { EditInvoice } from './modules/invoices/pages/EditInvoice';
import { CustomerInvoices } from './modules/invoices/pages/CustomerInvoices';
import { InvoicePrintView } from './modules/invoices/pages/InvoicePrintView';
import { TaxConfigurationList } from './modules/tax/pages/TaxConfigurationList';

// ── M11: Payment & Reconciliation Management ──
import PaymentList from './modules/payments/pages/PaymentList';
import RecordPayment from './modules/payments/pages/RecordPayment';
import PaymentDetails from './modules/payments/pages/PaymentDetails';
import PaymentReceipt from './modules/payments/pages/PaymentReceipt';
import CustomerPaymentHistory from './modules/payments/pages/CustomerPaymentHistory';
import ReconciliationDashboard from './modules/reconciliation/pages/ReconciliationDashboard';
import RefundList from './modules/refunds/pages/RefundList';

// ── M12: Dashboard & Analytics ──
import AdminDashboard from './modules/analytics/pages/AdminDashboard';
import RevenueAnalytics from './modules/analytics/pages/RevenueAnalytics';
import CustomerAnalytics from './modules/analytics/pages/CustomerAnalytics';
import SubscriptionAnalytics from './modules/analytics/pages/SubscriptionAnalytics';
import ProductAnalytics from './modules/analytics/pages/ProductAnalytics';

// Layout wrapper for authenticated routes
const AuthenticatedShell = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Auth Routes (Standalone cleanly styled pages without sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/invoices/:id/print" element={<InvoicePrintView />} />

          {/* Authenticated Application Routes (Protected with unified Sidebar & Header) */}
          <Route element={<AuthenticatedShell />}>
            {/* Default redirect to Dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Overview & Analytics (M12) */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics/revenue" element={<RevenueAnalytics />} />
            <Route path="/admin/analytics/customers" element={<CustomerAnalytics />} />
            <Route path="/admin/analytics/subscriptions" element={<SubscriptionAnalytics />} />
            <Route path="/admin/analytics/products" element={<ProductAnalytics />} />

            {/* Customers (M2) */}
            <Route path="/admin/customers" element={<CustomerList />} />
            <Route path="/admin/customers/create" element={<CreateCustomer />} />
            <Route path="/admin/customers/:id" element={<CustomerDetails />} />
            <Route path="/admin/customers/:id/edit" element={<EditCustomer />} />

            {/* Customer Portal (M2, M6, M7, M10, M11) */}
            <Route path="/customer/dashboard" element={<CustomerPortalDashboard />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/addresses" element={<CustomerAddresses />} />
            <Route path="/customer/invoices" element={<CustomerInvoices />} />
            <Route path="/customer/payments" element={<CustomerPaymentHistory />} />
            <Route path="/customer/payments/:id" element={<PaymentDetails />} />
            <Route path="/portal/quotations" element={<QuotationCustomerPortal />} />
            <Route path="/portal/subscriptions" element={<CustomerSubscriptions />} />
            <Route path="/customer/catalog" element={<CustomerSubscriptions />} />

            {/* Products & Subscription Plans (M3, M4) */}
            <Route path="/admin/products" element={<PlanDashboard />} />
            <Route path="/admin/plans" element={<PlanDashboard />} />
            <Route path="/admin/plans/create" element={<PlanCreate />} />
            <Route path="/admin/plans/:id/edit" element={<PlanEdit />} />

            {/* Quotation Templates (M5) */}
            <Route path="/templates" element={<TemplateList />} />
            <Route path="/templates/create" element={<CreateTemplate />} />
            <Route path="/templates/:id" element={<TemplateDetails />} />
            <Route path="/templates/:id/edit" element={<EditTemplate />} />

            {/* Quotations (M6) */}
            <Route path="/quotations" element={<QuotationDashboard />} />
            <Route path="/quotations/create" element={<CreateQuotation />} />
            <Route path="/quotations/:id" element={<QuotationDetails />} />
            <Route path="/quotations/:id/edit" element={<EditQuotation />} />

            {/* Subscriptions (M7) */}
            <Route path="/subscriptions" element={<SubscriptionDashboard />} />
            <Route path="/subscriptions/create" element={<CreateSubscription />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />

            {/* Discounts (M8) */}
            <Route path="/discounts" element={<DiscountDashboard />} />
            <Route path="/discounts/create" element={<CreateDiscount />} />
            <Route path="/discounts/edit/:id" element={<EditDiscount />} />
            <Route path="/discounts/details/:id" element={<DiscountDetails />} />
            <Route path="/discounts/test" element={<DiscountTester />} />

            {/* Recurring Billing (M9) */}
            <Route path="/admin/billing" element={<BillingDashboard />} />
            <Route path="/admin/billing/schedules" element={<BillingScheduleList />} />
            <Route path="/admin/billing/schedules/:id" element={<BillingScheduleDetails />} />
            <Route path="/admin/billing/runs" element={<BillingRuns />} />
            <Route path="/admin/billing/runs/:id" element={<BillingRunDetails />} />
            <Route path="/admin/billing/failed" element={<FailedBillings />} />
            <Route path="/admin/billing/history" element={<BillingHistory />} />

            {/* Invoices & Taxes (M10) */}
            <Route path="/admin/invoices" element={<InvoiceList />} />
            <Route path="/admin/invoices/create" element={<CreateInvoice />} />
            <Route path="/admin/invoices/:id" element={<InvoiceDetails />} />
            <Route path="/admin/invoices/:id/edit" element={<EditInvoice />} />
            <Route path="/admin/tax-configurations" element={<TaxConfigurationList />} />

            {/* Payments & Reconciliation (M11) */}
            <Route path="/admin/payments" element={<PaymentList />} />
            <Route path="/admin/payments/create" element={<RecordPayment />} />
            <Route path="/admin/payments/:id" element={<PaymentDetails />} />
            <Route path="/admin/payments/receipt/:id" element={<PaymentReceipt />} />
            <Route path="/admin/reconciliation" element={<ReconciliationDashboard />} />
            <Route path="/admin/refunds" element={<RefundList />} />

            {/* Administration & Staff (M1) */}
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
