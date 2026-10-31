import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';
import Navbar from './components/Navbar';

// ── M1: Auth Pages ──────────────────────────────────────────────────────────
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// ── M1: Dashboards & Role Pages ─────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Unauthorized from './pages/Unauthorized';

// ── M2: Admin Customer Management ───────────────────────────────────────────
import CustomerList from './pages/admin/CustomerList';
import CustomerDetails from './pages/admin/CustomerDetails';
import CreateCustomer from './pages/admin/CreateCustomer';
import EditCustomer from './pages/admin/EditCustomer';

// ── M2: Customer Portal ─────────────────────────────────────────────────────
import CustomerPortalDashboard from './pages/customer/CustomerPortalDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import CustomerInvoices from './pages/customer/CustomerInvoices';
import CustomerPayments from './pages/customer/CustomerPayments';

// ── M4: Subscription Plans ───────────────────────────────────────────────────
import PlanDashboard from './pages/admin/PlanDashboard';
import PlanCreate from './pages/admin/PlanCreate';
import PlanEdit from './pages/admin/PlanEdit';
import PlanDetails from './pages/admin/PlanDetails';
import PlanCatalog from './pages/customer/PlanCatalog';

// ── M5: Quotation Template Management ───────────────────────────────────────
import TemplateList from './pages/quotationTemplates/TemplateList';
import CreateTemplate from './pages/quotationTemplates/CreateTemplate';
import EditTemplate from './pages/quotationTemplates/EditTemplate';
import TemplateDetails from './pages/quotationTemplates/TemplateDetails';

// ── M6: Quotation Management ─────────────────────────────────────────────────
import QuotationDashboard from './pages/quotations/QuotationDashboard';
import CreateQuotation from './pages/quotations/CreateQuotation';
import EditQuotation from './pages/quotations/EditQuotation';
import QuotationDetails from './pages/quotations/QuotationDetails';

// ── M7: Subscription Lifecycle ───────────────────────────────────────────────
import SubscriptionDashboard from './pages/subscriptions/SubscriptionDashboard';
import CreateSubscription from './pages/subscriptions/CreateSubscription';
import SubscriptionDetails from './pages/subscriptions/SubscriptionDetails';

// ── M8: Discount Management ──────────────────────────────────────────────────
import DiscountDashboard from './pages/discounts/DiscountDashboard';
import CreateDiscount from './pages/discounts/CreateDiscount';
import EditDiscount from './pages/discounts/EditDiscount';
import DiscountDetails from './pages/discounts/DiscountDetails';
import DiscountTester from './pages/discounts/DiscountTester';

// ── M9: Recurring Billing Engine ─────────────────────────────────────────────
import BillingDashboard from './modules/billing/pages/BillingDashboard';
import BillingScheduleList from './modules/billing/pages/BillingScheduleList';
import BillingScheduleDetails from './modules/billing/pages/BillingScheduleDetails';
import BillingRuns from './modules/billing/pages/BillingRuns';
import BillingRunDetails from './modules/billing/pages/BillingRunDetails';
import FailedBillings from './modules/billing/pages/FailedBillings';
import BillingHistory from './modules/billing/pages/BillingHistory';

// ── M10: Invoice & Tax Management ────────────────────────────────────────────
import { InvoiceList } from './modules/invoices/pages/InvoiceList';
import { InvoiceDetails } from './modules/invoices/pages/InvoiceDetails';
import { CreateInvoice } from './modules/invoices/pages/CreateInvoice';
import { EditInvoice } from './modules/invoices/pages/EditInvoice';
import { InvoicePrintView } from './modules/invoices/pages/InvoicePrintView';
import { TaxConfigurationList } from './modules/tax/pages/TaxConfigurationList';

// ── M11: Payment & Reconciliation ────────────────────────────────────────────
import PaymentList from './modules/payments/pages/PaymentList';
import RecordPayment from './modules/payments/pages/RecordPayment';
import PaymentDetails from './modules/payments/pages/PaymentDetails';
import PaymentReceipt from './modules/payments/pages/PaymentReceipt';
import CustomerPaymentHistory from './modules/payments/pages/CustomerPaymentHistory';
import ReconciliationDashboard from './modules/reconciliation/pages/ReconciliationDashboard';
import RefundList from './modules/refunds/pages/RefundList';

// ── M12: Dashboard & Analytics ───────────────────────────────────────────────
import AnalyticsDashboard from './modules/analytics/pages/AdminDashboard';
import RevenueAnalytics from './modules/analytics/pages/RevenueAnalytics';
import CustomerAnalytics from './modules/analytics/pages/CustomerAnalytics';
import SubscriptionAnalytics from './modules/analytics/pages/SubscriptionAnalytics';
import ProductAnalytics from './modules/analytics/pages/ProductAnalytics';

// ── App Layout Wrapper with Top Navbar ───────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
    <Navbar />
    <main className="flex-1">{children}</main>
  </div>
);

// ── Smart Root Redirect ──────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, currentUser, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading Brightloop..." />;
  }

  const role = (user || currentUser)?.role || 'admin';
  switch (role) {
    case 'staff':
      return <Navigate to="/admin/quotations" replace />;
    case 'customer':
      return <Navigate to="/customer/dashboard" replace />;
    case 'admin':
    default:
      return <Navigate to="/admin/dashboard" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public Auth Routes (No Navbar) ──────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── M1: Dashboards & User Management ────────────────────── */}
          <Route path="/admin/dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/users" element={<AppLayout><UserManagement /></AppLayout>} />

          {/* ── M2: Customer Management ─────────────────────────────── */}
          <Route path="/admin/customers" element={<AppLayout><CustomerList /></AppLayout>} />
          <Route path="/admin/customers/create" element={<AppLayout><CreateCustomer /></AppLayout>} />
          <Route path="/admin/customers/:id" element={<AppLayout><CustomerDetails /></AppLayout>} />
          <Route path="/admin/customers/:id/edit" element={<AppLayout><EditCustomer /></AppLayout>} />

          {/* ── M4: Subscription Plans ──────────────────────────────── */}
          <Route path="/admin/plans" element={<AppLayout><PlanDashboard /></AppLayout>} />
          <Route path="/admin/plans/create" element={<AppLayout><PlanCreate /></AppLayout>} />
          <Route path="/admin/plans/:id/edit" element={<AppLayout><PlanEdit /></AppLayout>} />
          <Route path="/admin/plans/:id" element={<AppLayout><PlanDetails /></AppLayout>} />
          <Route path="/customer/plans" element={<AppLayout><PlanCatalog /></AppLayout>} />

          {/* ── M5: Quotation Templates ─────────────────────────────── */}
          <Route path="/admin/quotation-templates" element={<AppLayout><TemplateList /></AppLayout>} />
          <Route path="/admin/quotation-templates/create" element={<AppLayout><CreateTemplate /></AppLayout>} />
          <Route path="/admin/quotation-templates/:id" element={<AppLayout><TemplateDetails /></AppLayout>} />
          <Route path="/admin/quotation-templates/:id/edit" element={<AppLayout><EditTemplate /></AppLayout>} />
          <Route path="/quotation-templates" element={<Navigate to="/admin/quotation-templates" replace />} />

          {/* ── M6: Quotation Management (Direct + Admin Aliases) ───── */}
          <Route path="/quotations" element={<AppLayout><QuotationDashboard /></AppLayout>} />
          <Route path="/quotations/create" element={<AppLayout><CreateQuotation /></AppLayout>} />
          <Route path="/quotations/:id" element={<AppLayout><QuotationDetails /></AppLayout>} />
          <Route path="/quotations/:id/edit" element={<AppLayout><EditQuotation /></AppLayout>} />
          <Route path="/admin/quotations" element={<AppLayout><QuotationDashboard /></AppLayout>} />
          <Route path="/admin/quotations/create" element={<AppLayout><CreateQuotation /></AppLayout>} />
          <Route path="/admin/quotations/:id" element={<AppLayout><QuotationDetails /></AppLayout>} />
          <Route path="/admin/quotations/:id/edit" element={<AppLayout><EditQuotation /></AppLayout>} />

          {/* ── M7: Subscription Lifecycle (Direct + Admin Aliases) ─── */}
          <Route path="/subscriptions" element={<AppLayout><SubscriptionDashboard /></AppLayout>} />
          <Route path="/subscriptions/create" element={<AppLayout><CreateSubscription /></AppLayout>} />
          <Route path="/subscriptions/:id" element={<AppLayout><SubscriptionDetails /></AppLayout>} />
          <Route path="/admin/subscriptions" element={<AppLayout><SubscriptionDashboard /></AppLayout>} />
          <Route path="/admin/subscriptions/create" element={<AppLayout><CreateSubscription /></AppLayout>} />
          <Route path="/admin/subscriptions/:id" element={<AppLayout><SubscriptionDetails /></AppLayout>} />

          {/* ── M8: Discount Management (Direct + Admin Aliases) ────── */}
          <Route path="/discounts" element={<AppLayout><DiscountDashboard /></AppLayout>} />
          <Route path="/discounts/create" element={<AppLayout><CreateDiscount /></AppLayout>} />
          <Route path="/discounts/tester" element={<AppLayout><DiscountTester /></AppLayout>} />
          <Route path="/discounts/:id" element={<AppLayout><DiscountDetails /></AppLayout>} />
          <Route path="/discounts/:id/edit" element={<AppLayout><EditDiscount /></AppLayout>} />
          <Route path="/admin/discounts" element={<AppLayout><DiscountDashboard /></AppLayout>} />
          <Route path="/admin/discounts/create" element={<AppLayout><CreateDiscount /></AppLayout>} />
          <Route path="/admin/discounts/tester" element={<AppLayout><DiscountTester /></AppLayout>} />
          <Route path="/admin/discounts/:id" element={<AppLayout><DiscountDetails /></AppLayout>} />
          <Route path="/admin/discounts/:id/edit" element={<AppLayout><EditDiscount /></AppLayout>} />

          {/* ── M9: Recurring Billing Engine (Direct + Admin Aliases) ─ */}
          <Route path="/billing" element={<AppLayout><BillingDashboard /></AppLayout>} />
          <Route path="/admin/billing" element={<AppLayout><BillingDashboard /></AppLayout>} />
          <Route path="/admin/billing/schedules" element={<AppLayout><BillingScheduleList /></AppLayout>} />
          <Route path="/admin/billing/schedules/:id" element={<AppLayout><BillingScheduleDetails /></AppLayout>} />
          <Route path="/admin/billing/runs" element={<AppLayout><BillingRuns /></AppLayout>} />
          <Route path="/admin/billing/runs/:id" element={<AppLayout><BillingRunDetails /></AppLayout>} />
          <Route path="/admin/billing/failed" element={<AppLayout><FailedBillings /></AppLayout>} />
          <Route path="/admin/billing/history" element={<AppLayout><BillingHistory /></AppLayout>} />

          {/* ── M10: Invoice & Tax Management (Direct + Admin Aliases) ─ */}
          <Route path="/invoices" element={<AppLayout><InvoiceList /></AppLayout>} />
          <Route path="/invoices/create" element={<AppLayout><CreateInvoice /></AppLayout>} />
          <Route path="/invoices/:id" element={<AppLayout><InvoiceDetails /></AppLayout>} />
          <Route path="/invoices/:id/edit" element={<AppLayout><EditInvoice /></AppLayout>} />
          <Route path="/invoices/:id/print" element={<InvoicePrintView />} />
          <Route path="/admin/invoices" element={<AppLayout><InvoiceList /></AppLayout>} />
          <Route path="/admin/invoices/create" element={<AppLayout><CreateInvoice /></AppLayout>} />
          <Route path="/admin/invoices/:id" element={<AppLayout><InvoiceDetails /></AppLayout>} />
          <Route path="/admin/invoices/:id/edit" element={<AppLayout><EditInvoice /></AppLayout>} />
          <Route path="/admin/tax-configurations" element={<AppLayout><TaxConfigurationList /></AppLayout>} />

          {/* ── M11: Payment & Reconciliation (Direct + Admin Aliases) ─ */}
          <Route path="/payments" element={<AppLayout><PaymentList /></AppLayout>} />
          <Route path="/payments/create" element={<AppLayout><RecordPayment /></AppLayout>} />
          <Route path="/payments/:id" element={<AppLayout><PaymentDetails /></AppLayout>} />
          <Route path="/payments/receipt/:id" element={<AppLayout><PaymentReceipt /></AppLayout>} />
          <Route path="/admin/payments" element={<AppLayout><PaymentList /></AppLayout>} />
          <Route path="/admin/payments/create" element={<AppLayout><RecordPayment /></AppLayout>} />
          <Route path="/admin/payments/receipt/:id" element={<AppLayout><PaymentReceipt /></AppLayout>} />
          <Route path="/admin/payments/:id" element={<AppLayout><PaymentDetails /></AppLayout>} />
          <Route path="/admin/reconciliation" element={<AppLayout><ReconciliationDashboard /></AppLayout>} />
          <Route path="/admin/refunds" element={<AppLayout><RefundList /></AppLayout>} />

          {/* ── M12: Analytics ──────────────────────────────────────── */}
          <Route path="/analytics" element={<AppLayout><AnalyticsDashboard /></AppLayout>} />
          <Route path="/admin/analytics" element={<AppLayout><AnalyticsDashboard /></AppLayout>} />
          <Route path="/admin/analytics/revenue" element={<AppLayout><RevenueAnalytics /></AppLayout>} />
          <Route path="/admin/analytics/customers" element={<AppLayout><CustomerAnalytics /></AppLayout>} />
          <Route path="/admin/analytics/subscriptions" element={<AppLayout><SubscriptionAnalytics /></AppLayout>} />
          <Route path="/admin/analytics/products" element={<AppLayout><ProductAnalytics /></AppLayout>} />

          {/* ── Customer Portal Routes ──────────────────────────────── */}
          <Route path="/customer/dashboard" element={<AppLayout><CustomerPortalDashboard /></AppLayout>} />
          <Route path="/customer/profile" element={<AppLayout><CustomerProfile /></AppLayout>} />
          <Route path="/customer/addresses" element={<AppLayout><CustomerAddresses /></AppLayout>} />
          <Route path="/customer/subscriptions" element={<AppLayout><CustomerSubscriptions /></AppLayout>} />
          <Route path="/customer/quotations" element={<AppLayout><CustomerQuotations /></AppLayout>} />
          <Route path="/customer/invoices" element={<AppLayout><CustomerInvoices /></AppLayout>} />
          <Route path="/customer/payments" element={<AppLayout><CustomerPayments /></AppLayout>} />
          <Route path="/customer/payments/history" element={<AppLayout><CustomerPaymentHistory /></AppLayout>} />
          <Route path="/customer/payments/:id" element={<AppLayout><PaymentDetails /></AppLayout>} />

          {/* ── Staff Routes ────────────────────────────────────────── */}
          <Route path="/staff/dashboard" element={<AppLayout><StaffDashboard /></AppLayout>} />
          <Route path="/staff/quotation-templates" element={<AppLayout><TemplateList /></AppLayout>} />
          <Route path="/staff/quotation-templates/:id" element={<AppLayout><TemplateDetails /></AppLayout>} />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
