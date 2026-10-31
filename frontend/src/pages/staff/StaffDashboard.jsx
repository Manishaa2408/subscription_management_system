import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Briefcase, CheckCircle2, User } from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Staff Operations Dashboard</h1>
            <p className="page-subtitle">
              Internal business operations and customer servicing portal
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
                background: '#fef3c7',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Welcome, {user?.fullName}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                Signed in as <strong style={{ color: '#92400e' }}>Staff Member</strong> ({user?.email})
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
              <CheckCircle2 size={16} />
              <span>Staff Authentication & Role Verified (M1)</span>
            </div>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.825rem' }}>
              Your session is active. You are authorized to access staff operations. In subsequent modules (M5–M7), Quotation and Subscription Management interfaces will connect directly into this operational space.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>User ID:</strong> <code>{user?.id}</code></div>
            <div><strong>Phone:</strong> {user?.phone || 'Not provided'}</div>
            <div><strong>Account Status:</strong> <span className="badge-active">Active</span></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
