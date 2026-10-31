import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboards & Role Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Unauthorized from './pages/Unauthorized';

// M2 – Admin Customer Management Pages
import CustomerList from './pages/admin/CustomerList';
import CustomerDetails from './pages/admin/CustomerDetails';
import CreateCustomer from './pages/admin/CreateCustomer';
import EditCustomer from './pages/admin/EditCustomer';

// M2 – Customer Portal Pages
import CustomerPortalDashboard from './pages/customer/CustomerPortalDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';
import PlanDashboard from './pages/admin/PlanDashboard';
import PlanCreate from './pages/admin/PlanCreate';
import PlanEdit from './pages/admin/PlanEdit';
import PlanDetails from './pages/admin/PlanDetails';
import PlanCatalog from './pages/customer/PlanCatalog';
import CustomerQuotations from './pages/customer/CustomerQuotations';
import CustomerInvoices from './pages/customer/CustomerInvoices';
import CustomerPayments from './pages/customer/CustomerPayments';

// Smart Root Redirect based on role
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
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── Admin: Core ─────────────────────────────────────────── */}
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

          {/* ── Admin: M2 Customer Management ───────────────────────── */}
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
          {/* ── Admin: M4 Subscription Plan Management ───────────────────── */}
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

          {/* ── Staff ───────────────────────────────────────────────── */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Customer: Legacy placeholder (M1) ───────────────────── */}
          <Route
            path="/customer/dashboard-legacy"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Customer: M2 Portal ──────────────────────────────────── */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerPortalDashboard />
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

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
