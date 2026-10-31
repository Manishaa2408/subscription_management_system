import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import customerService from '../../services/customerService';

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await customerService.getPortalInvoices();
        setInvoices(data.invoices || data || []);
        setSummary(data.summary || null);
      } catch (err) {
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusClass = (status) => {
    const map = {
      paid:       'badge-active',
      unpaid:     'badge-inactive',
      overdue:    'badge-inactive',
      draft:      'badge-staff',
      cancelled:  'badge-inactive',
      'in payment': 'badge-staff',
    };
    return map[status?.toLowerCase()] || 'badge-inactive';
  };

  return (
    <PortalLayout>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          My Invoices
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Review all invoices and outstanding dues.
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Invoiced', value: summary.totalAmount, color: 'var(--primary)' },
            { label: 'Amount Due',     value: summary.amountDue,   color: '#e74c3c' },
            { label: 'Paid',           value: summary.paidAmount,  color: '#27ae60' },
          ].map((card) => (
            <div key={card.label} className="dashboard-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color, marginTop: '0.25rem' }}>
                ₹{(card.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading invoices…
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {!loading && !error && (
        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
          {invoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No invoices found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Amount Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id || inv.id || inv.invoiceNumber}>
                      <td style={{ fontWeight: 600 }}>{inv.invoiceNumber || inv.number || '—'}</td>
                      <td>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}</td>
                      <td>
                        {inv.dueDate
                          ? <span style={{ color: new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? '#e74c3c' : 'inherit' }}>
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </span>
                          : '—'}
                      </td>
                      <td>₹{(inv.amount || inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>₹{(inv.amountDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`nav-badge ${statusClass(inv.status)}`}>
                          {inv.status || 'Draft'}
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
