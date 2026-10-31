import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

/**
 * Reusable Protected Route Component
 * Seamlessly verifies session and role across all modules
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying session..." />;
  }

  const activeUser = user || currentUser;

  // If no user at all, redirect to login
  if (!activeUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const role = activeUser.role || 'admin';
    if (!allowedRoles.includes(role)) {
      const roleDashboardMap = {
        admin: '/admin/dashboard',
        staff: '/staff/dashboard',
        customer: '/customer/dashboard',
      };
      const defaultRedirect = roleDashboardMap[role] || '/admin/dashboard';
      return <Navigate to={defaultRedirect} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
