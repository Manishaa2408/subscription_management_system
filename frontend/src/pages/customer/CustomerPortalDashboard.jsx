import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  Repeat,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';

const CustomerPortalDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await customerService.getPortalDashboard();
        if (res && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load customer portal dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <PortalLayout title="Dashboard" subtitle="Welcome to your Brightloop Software subscription portal">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading your subscription data...</p>
        </div>
      </PortalLayout>
    );
  }

  const { customer, stats, recentSubscriptions = [], recentInvoices = [], recentPayments = [], recentActivity = [] } =
    data || {};

  return (
    <PortalLayout
      title={`Welcome back, ${customer?.displayName || 'Customer'}`}
      subtitle="Here is an overview of your active subscriptions, billing statements, and recent operations."
    >
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div className="dashboard-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Active Subscriptions
            </span>
            <Repeat size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {stats?.activeSubscriptions || 0}
          </div>
          <Link
            to="/customer/subscriptions"
            style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>Manage plans</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="dashboard-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Outstanding Balance
            </span>
            <Receipt size={18} color={stats?.totalOutstandingBalance > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: stats?.totalOutstandingBalance > 0 ? '#b91c1c' : '#15803d',
              marginTop: '0.25rem'
            }}
          >
            ₹{(stats?.totalOutstandingBalance || 0).toLocaleString()}
          </div>
          <Link
            to="/customer/invoices"
            style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>View invoices</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="dashboard-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Total Paid
            </span>
            <CreditCard size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
            ₹{(stats?.totalPaidAmount || 0).toLocaleString()}
          </div>
          <Link
            to="/customer/payments"
            style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>Payment history</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="dashboard-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Account Status
            </span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
            {customer?.status || 'Active'}
          </div>
          <div style={{ fontSize: '0.785rem', color: 'var(--slate-400)', marginTop: '0.5rem' }}>
            Code: <code>{customer?.customerCode || 'CUST-PORTAL'}</code>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Active Subscriptions */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--slate-900)' }}>Active Subscriptions</h3>
            <Link to="/customer/subscriptions" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          {recentSubscriptions.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No subscriptions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSubscriptions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--slate-50)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.planName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Renews: {new Date(s.nextBillingDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                      ₹{s.amount.toLocaleString()} / {s.interval}
                    </div>
                    <span className="badge-active" style={{ fontSize: '0.7rem' }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--slate-900)' }}>Recent Invoices</h3>
            <Link to="/customer/invoices" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No invoices found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--slate-50)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                      ₹{inv.totalAmount.toLocaleString()}
                    </div>
                    <span
                      className={inv.status === 'paid' ? 'badge-active' : 'badge-inactive'}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Activity Timeline */}
      <div className="dashboard-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Account Activity</h3>
        {recentActivity.length === 0 ? (
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No recent account events logged.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((act) => (
              <div
                key={act.id || act._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Clock size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>{act.description}</span>
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default CustomerPortalDashboard;
