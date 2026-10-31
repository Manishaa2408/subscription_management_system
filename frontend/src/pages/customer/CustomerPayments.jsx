import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import customerService from '../../services/customerService';

export default function CustomerPayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await customerService.getPortalPayments();
        setPayments(data.payments || data || []);
        setSummary(data.summary || null);
      } catch (err) {
        setError(err.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusClass = (status) => {
    const map = {
      posted:    'badge-active',
      draft:     'badge-staff',
      cancelled: 'badge-inactive',
      failed:    'badge-inactive',
    };
    return map[status?.toLowerCase()] || 'badge-inactive';
  };

  const methodLabel = (method) => {
    const map = {
      bank_transfer: 'Bank Transfer',
      credit_card:   'Credit Card',
      upi:           'UPI',
      cash:          'Cash',
      cheque:        'Cheque',
    };
    return map[method] || method || '—';
  };

  return (
    <PortalLayout>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          My Payments
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          History of all payments made on your account.
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Paid',    value: summary.totalPaid,    color: '#27ae60' },
            { label: 'Transactions',  value: summary.count,        color: 'var(--primary)', isCurrency: false },
            { label: 'Last Payment',  value: summary.lastPaymentDate
                ? new Date(summary.lastPaymentDate).toLocaleDateString()
                : '—', color: 'var(--text-primary)', isCurrency: false, isText: true },
          ].map((card) => (
            <div key={card.label} className="dashboard-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </p>
              <p style={{ fontSize: card.isText ? '1rem' : '1.4rem', fontWeight: 700, color: card.color, marginTop: '0.25rem' }}>
                {card.isText
                  ? card.value
                  : card.isCurrency === false
                    ? card.value
                    : `₹${(card.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading payments…
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
          {payments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Invoice Ref</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pmt) => (
                    <tr key={pmt._id || pmt.id || pmt.paymentNumber}>
                      <td style={{ fontWeight: 600 }}>{pmt.paymentNumber || pmt.number || '—'}</td>
                      <td>{pmt.invoiceRef || pmt.invoiceNumber || '—'}</td>
                      <td>{pmt.paymentDate ? new Date(pmt.paymentDate).toLocaleDateString() : '—'}</td>
                      <td>₹{(pmt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>{methodLabel(pmt.paymentMethod || pmt.method)}</td>
                      <td>
                        <span className={`nav-badge ${statusClass(pmt.status)}`}>
                          {pmt.status || 'Posted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
