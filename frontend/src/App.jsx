import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';

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

// ── Smart Root Redirect ──────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading Brightloop..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'staff':
      return <Navigate to="/staff/dashboard" replace />;
    case 'customer':
    default:
      return <Navigate to="/customer/dashboard" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public Routes ───────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── M1: Admin Core ──────────────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* ── M2: Customer Management ─────────────────────────────── */}
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CustomerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateCustomer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CustomerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditCustomer />
              </ProtectedRoute>
            }
          />

          {/* ── M4: Subscription Plan Management ────────────────────── */}
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PlanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PlanCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PlanEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <PlanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/plans"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <PlanCatalog />
              </ProtectedRoute>
            }
          />

          {/* ── M5: Quotation Template Management ───────────────────── */}
          <Route
            path="/admin/quotation-templates"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <TemplateList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotation-templates/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateTemplate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotation-templates/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <TemplateDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotation-templates/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditTemplate />
              </ProtectedRoute>
            }
          />
          {/* Staff aliases */}
          <Route
            path="/staff/quotation-templates"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <TemplateList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/quotation-templates/:id"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <TemplateDetails />
              </ProtectedRoute>
            }
          />

          {/* ── M6: Quotation Management ────────────────────────────── */}
          <Route
            path="/admin/quotations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <QuotationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations/create"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CreateQuotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <QuotationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <EditQuotation />
              </ProtectedRoute>
            }
          />

          {/* ── M7: Subscription Lifecycle Management ───────────────── */}
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <SubscriptionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions/create"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <CreateSubscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <SubscriptionDetails />
              </ProtectedRoute>
            }
          />

          {/* ── M8: Discount Management ─────────────────────────────── */}
          <Route
            path="/admin/discounts"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DiscountDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateDiscount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DiscountDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditDiscount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts/tester"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DiscountTester />
              </ProtectedRoute>
            }
          />

          {/* ── M1: Staff Dashboard ─────────────────────────────────── */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── M2: Customer Portal ─────────────────────────────────── */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerPortalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard-legacy"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/addresses"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerAddresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerSubscriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/quotations"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerQuotations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/invoices"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerInvoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/payments"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerPayments />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
