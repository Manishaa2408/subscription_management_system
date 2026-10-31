import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import PortalLayout from '../../components/portal/PortalLayout';
import { Repeat, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';

const CustomerSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await customerService.getPortalSubscriptions();
        if (res && res.data) {
          setSubscriptions(res.data.subscriptions || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  return (
    <PortalLayout
      title="My Subscriptions"
      subtitle="View your active software licenses, recurring plans, and renewal terms"
    >
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Repeat size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ color: 'var(--slate-700)' }}>No subscriptions active</h4>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
            You do not currently have any active SaaS recurring plans.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Plan Name</th>
                <th>Recurring Amount</th>
                <th>Start Date</th>
                <th>Next Billing Date</th>
                <th>Auto-Renew</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.subscriptionNumber}</code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{s.planName}</div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--slate-800)' }}>₹{s.amount.toLocaleString()}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}> / {s.interval}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(s.startDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                    {new Date(s.nextBillingDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: s.autoRenew ? 'var(--success)' : 'var(--slate-400)' }}>
                      {s.autoRenew ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <span className={s.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalLayout>
  );
};

export default CustomerSubscriptions;
