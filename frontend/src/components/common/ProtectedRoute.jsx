import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

/**
 * Reusable Protected Route Component
 * Restricts access to authenticated users and specific roles
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying session..." />;
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to their role-specific dashboard
    const roleDashboardMap = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      customer: '/customer/dashboard',
    };
    const defaultRedirect = roleDashboardMap[user.role] || '/unauthorized';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

export default ProtectedRoute;
