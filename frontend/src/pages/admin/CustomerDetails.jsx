import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Navbar from '../../components/common/Navbar';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  Plus,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, notes, activity, finance
  const [alert, setAlert] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, notesRes, actRes] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerNotes(id).catch(() => ({ data: { notes: [] } })),
        customerService.getCustomerActivity(id).catch(() => ({ data: { activities: [] } }))
      ]);

      if (custRes && custRes.data) {
        setCustomer(custRes.data.customer);
      }
      if (notesRes && notesRes.data) {
        setNotes(notesRes.data.notes || []);
      }
      if (actRes && actRes.data) {
        setActivities(actRes.data.activities || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load customer profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setNoteSubmitting(true);
      const res = await customerService.addCustomerNote(id, { note: newNote.trim() });
      if (res && res.data) {
        setNotes((prev) => [res.data.note, ...prev]);
        setNewNote('');
        setAlert({ type: 'success', message: 'Internal note recorded.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to add note' });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await customerService.updateCustomerStatus(id, newStatus);
      setCustomer((prev) => ({ ...prev, status: newStatus }));
      setAlert({ type: 'success', message: `Customer status changed to ${newStatus}` });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update status' });
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--slate-500)' }}>Loading customer record...</p>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="alert alert-danger">Customer profile not found.</div>
          <Link to="/admin/customers" className="btn btn-secondary" style={{ width: 'auto' }}>
            Back to Customers
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/admin/customers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--slate-600)',
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Customers</span>
          </Link>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 className="page-title">{customer.displayName}</h1>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                  [{customer.customerCode}]
                </span>
                <span
                  className={
                    customer.status === 'active'
                      ? 'badge-active'
                      : customer.status === 'suspended'
                      ? 'badge-admin'
                      : 'badge-inactive'
                  }
                >
                  {customer.status}
                </span>
              </div>
              <p className="page-subtitle">
                {customer.customerType === 'business' ? 'Corporate Client' : 'Individual Subscriber'} • Client since{' '}
                {new Date(customer.customerSince).toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={customer.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <Link
                to={`/admin/customers/${customer.id || customer._id}/edit`}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.45rem 1rem' }}
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Financial & Adapter Metric Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div className="dashboard-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Active Subscriptions
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
              {customer.subscriptionSummary?.activeSubscriptions || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
              ₹{customer.subscriptionSummary?.monthlyRunRate || 0} / mo run rate
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Total Invoiced
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              ₹{(customer.invoiceSummary?.totalInvoiced || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
              {customer.invoiceSummary?.totalInvoices || 0} total invoices generated
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Outstanding Balance
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: customer.invoiceSummary?.totalOutstanding > 0 ? '#b91c1c' : '#15803d',
                marginTop: '0.25rem'
              }}
            >
              ₹{(customer.invoiceSummary?.totalOutstanding || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
              {customer.invoiceSummary?.overdueInvoices || 0} overdue invoices
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Total Payments Recorded
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
              ₹{(customer.paymentSummary?.totalPaidAmount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
              {customer.paymentSummary?.totalPayments || 0} successful transactions
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--slate-200)', marginBottom: '1.5rem' }}>
          {[
            { id: 'overview', label: 'Overview & Addresses' },
            { id: 'notes', label: `Internal Notes (${notes.length})` },
            { id: 'activity', label: `Activity History (${activities.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--slate-600)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Contact & Business Info */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem' }}>
                Contact & Classification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><strong>Email:</strong> {customer.email}</div>
                <div><strong>Phone:</strong> {customer.phone || '—'}</div>
                <div><strong>Alternate Phone:</strong> {customer.alternatePhone || '—'}</div>
                <div><strong>Customer Type:</strong> <span style={{ textTransform: 'capitalize' }}>{customer.customerType}</span></div>
                {customer.customerType === 'business' && (
                  <>
                    <div><strong>Company Name:</strong> {customer.companyName || '—'}</div>
                    <div><strong>GSTIN:</strong> <code>{customer.gstin || 'Not provided'}</code></div>
                    <div><strong>Registration / CIN:</strong> {customer.businessRegistrationNumber || '—'}</div>
                    <div><strong>Industry:</strong> {customer.industry || '—'}</div>
                    <div><strong>Website:</strong> {customer.website ? <a href={customer.website} target="_blank" rel="noreferrer">{customer.website}</a> : '—'}</div>
                  </>
                )}
                {customer.description && (
                  <div style={{ marginTop: '0.5rem', background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '6px' }}>
                    <strong>Notes/Description:</strong>
                    <p style={{ color: 'var(--slate-600)', marginTop: '0.25rem' }}>{customer.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.5rem' }}>
                Registered Addresses
              </h3>

              <div style={{ marginBottom: '1.25rem' }}>
                <span className="nav-badge" style={{ background: '#eff6ff', color: '#1d4ed8', marginBottom: '0.4rem', display: 'inline-block' }}>
                  Billing Address
                </span>
                {customer.billingAddress ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                    <div>{customer.billingAddress.addressLine1}</div>
                    {customer.billingAddress.addressLine2 && <div>{customer.billingAddress.addressLine2}</div>}
                    <div>{customer.billingAddress.city}, {customer.billingAddress.state} - {customer.billingAddress.postalCode}</div>
                    <div>{customer.billingAddress.country}</div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No billing address recorded.</p>
                )}
              </div>

              <div>
                <span className="nav-badge" style={{ background: '#f8fafc', color: '#475569', marginBottom: '0.4rem', display: 'inline-block' }}>
                  Shipping Address
                </span>
                {customer.shippingAddress ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                    <div>{customer.shippingAddress.addressLine1}</div>
                    {customer.shippingAddress.addressLine2 && <div>{customer.shippingAddress.addressLine2}</div>}
                    <div>{customer.shippingAddress.city}, {customer.shippingAddress.state} - {customer.shippingAddress.postalCode}</div>
                    <div>{customer.shippingAddress.country}</div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No shipping address recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Internal Notes */}
        {activeTab === 'notes' && (
          <div className="dashboard-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Internal Staff Notes</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              Internal notes are strictly restricted to Administrators and Staff. Customers never see these remarks.
            </p>

            <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Record call summary, special billing agreement, or servicing notes..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: 'auto' }}
                disabled={noteSubmitting}
              >
                {noteSubmitting ? 'Saving Note...' : 'Add Internal Note'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notes.length === 0 ? (
                <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>No notes recorded for this customer yet.</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id || n._id}
                    style={{
                      background: 'var(--slate-50)',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--slate-800)' }}>
                        {n.authorName || 'Staff Member'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-700)', whiteSpace: 'pre-wrap' }}>
                      {n.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Activity Audit History */}
        {activeTab === 'activity' && (
          <div className="dashboard-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Customer Audit Trail</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              Append-only audit events tracking lifecycle changes for this account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>No activity history logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id || act._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      borderBottom: '1px solid var(--slate-100)',
                      paddingBottom: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#eff6ff',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px'
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-800)' }}>
                          {act.description}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--slate-500)' }}>
                        Action: <code>{act.action}</code> • Performed by: {act.performedBy?.name || 'System'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDetails;
