import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  MapPin,
  Repeat,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  LogOut,
  Layers,
  ShieldCheck
} from 'lucide-react';

const PortalLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/profile', label: 'My Profile', icon: User },
    { to: '/customer/addresses', label: 'My Addresses', icon: MapPin },
    { to: '/customer/subscriptions', label: 'My Subscriptions', icon: Repeat },
    { to: '/customer/quotations', label: 'My Quotations', icon: FileSpreadsheet },
    { to: '/customer/invoices', label: 'My Invoices', icon: Receipt },
    { to: '/customer/payments', label: 'My Payments', icon: CreditCard }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--slate-50)' }}>
      {/* Top Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--slate-200)',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        <Link to="/customer/dashboard" className="nav-brand">
          <div className="nav-brand-icon">
            <Layers size={20} />
          </div>
          <span>Brightloop Portal</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{user?.email}</div>
          </div>
          <span className="nav-badge badge-customer">Customer</span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {/* Portal Navigation Sidebar */}
        <aside
          style={{
            width: '240px',
            flexShrink: 0,
            marginRight: '2rem'
          }}
        >
          <div className="dashboard-card" style={{ padding: '0.75rem' }}>
            <div style={{ padding: '0.5rem 0.75rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-400)', letterSpacing: '0.05em' }}>
              Customer Portal
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--primary)' : 'var(--slate-600)',
                      background: isActive ? '#eff6ff' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
