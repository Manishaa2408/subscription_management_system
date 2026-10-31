import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { UserCheck, CheckCircle2, ShieldCheck, Mail, Phone } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Customer Portal</h1>
            <p className="page-subtitle">
              Manage your Brightloop Software subscriptions, licenses, and billing
            </p>
          </div>
        </div>

        <div className="dashboard-card" style={{ maxWidth: '700px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e0e7ff',
                color: '#3730a3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Welcome, {user?.fullName}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                Customer Account ({user?.email})
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600, marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} />
              <span>Customer Authentication Active (M1)</span>
            </div>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.825rem' }}>
              You are securely signed in. In upcoming Module 2 (Customer Management & Portal), your full subscription details, active services, and self-service invoices will be rendered here with strict account data privacy.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={15} color="var(--slate-400)" />
              <strong>Email:</strong> {user?.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} color="var(--slate-400)" />
              <strong>Phone:</strong> {user?.phone || 'Not registered'}
            </div>
            <div><strong>Role Assigned:</strong> <span className="nav-badge badge-customer">Customer</span></div>
            <div><strong>Customer Reference ID:</strong> <code>{user?.id}</code></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
