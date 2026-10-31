import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Layers, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to={getDashboardPath()} className="nav-brand">
          <div className="nav-brand-icon">
            <Layers size={20} />
          </div>
          <span>Brightloop</span>
        </Link>

        {user && (
          <div className="nav-links">
            <Link to={getDashboardPath()} style={{ color: 'var(--slate-700)', fontSize: '0.9rem' }}>
              Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin/users"
                style={{
                  color: 'var(--slate-700)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Users size={16} />
                <span>User Management</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {user && (
        <div className="nav-user">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-800)' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              {user.email}
            </div>
          </div>

          <span className={`nav-badge badge-${user.role}`}>
            {user.role}
          </span>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            title="Log Out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
