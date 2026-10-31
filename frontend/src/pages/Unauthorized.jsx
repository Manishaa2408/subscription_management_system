import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'customer':
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
          Access Denied
        </h2>

        <p style={{ color: 'var(--slate-500)', fontSize: '0.925rem', marginBottom: '1.75rem' }}>
          You do not have the required permissions to view this resource. Your current role is{' '}
          <strong className={`nav-badge badge-${user?.role || 'customer'}`}>
            {user?.role || 'unauthenticated'}
          </strong>.
        </p>

        <Link to={getDashboardPath()} className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Your Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
