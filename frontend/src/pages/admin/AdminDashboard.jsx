import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Shield, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              System Administrator Control Center for Brightloop Software
            </p>
          </div>
        </div>

        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Welcome, {user?.fullName}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                Signed in as <strong style={{ color: '#991b1b' }}>Administrator</strong> ({user?.email})
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600, marginBottom: '0.25rem' }}>
              <CheckCircle2 size={16} />
              <span>Authentication & Role Management (M1) Verified</span>
            </div>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.825rem' }}>
              Your session is secured via HttpOnly JWT cookies. You have full system privileges to manage staff and user permissions.
            </p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="dashboard-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Users size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem' }}>Staff & User Management</h3>
            </div>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Create internal staff accounts, view registered customers, toggle account statuses, and modify permitted roles.
            </p>
            <Link to="/admin/users" className="btn btn-primary" style={{ width: 'auto' }}>
              <span>Manage Users</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
