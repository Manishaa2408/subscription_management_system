import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import customerService from '../../services/customerService';

export default function CustomerQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await customerService.getPortalQuotations();
        setQuotations(data.quotations || data || []);
      } catch (err) {
        setError(err.message || 'Failed to load quotations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusClass = (status) => {
    const map = {
      draft:    'badge-inactive',
      sent:     'badge-staff',
      confirmed:'badge-active',
      expired:  'badge-inactive',
      cancelled:'badge-inactive',
    };
    return map[status?.toLowerCase()] || 'badge-inactive';
  };

  return (
    <PortalLayout>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          My Quotations
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          View all quotations associated with your account.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading quotations…
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
          {quotations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No quotations found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Date</th>
                    <th>Valid Until</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q._id || q.id || q.quotationNumber}>
                      <td style={{ fontWeight: 600 }}>{q.quotationNumber || q.number || '—'}</td>
                      <td>{q.date ? new Date(q.date).toLocaleDateString() : '—'}</td>
                      <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                      <td>
                        {q.currency || '₹'}{(q.amount || q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`nav-badge ${statusClass(q.status)}`}>
                          {q.status || 'Draft'}
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
