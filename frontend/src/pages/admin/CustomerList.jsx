import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Navbar from '../../components/common/Navbar';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Building2,
  User,
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({
        search,
        customerType,
        status,
        page: pagination.page,
        limit: 10
      });

      if (res && res.data) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch customer records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [customerType, status, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleStatusToggle = async (customer) => {
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to change status of ${customer.displayName} to '${nextStatus}'?`)) {
      return;
    }

    try {
      await customerService.updateCustomerStatus(customer.id || customer._id, nextStatus);
      setAlert({
        type: 'success',
        message: `Status for ${customer.displayName} updated to '${nextStatus}'.`
      });
      fetchCustomers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update customer status' });
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Customer Management</h1>
            <p className="page-subtitle">
              Manage client directory, business information, billing configurations, and account statuses.
            </p>
          </div>

          <Link
            to="/admin/customers/create"
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            <UserPlus size={18} />
            <span>Create Customer</span>
          </Link>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{alert.message}</div>
            <button
              onClick={() => setAlert(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '280px' }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon-left">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-input has-left-icon"
                  placeholder="Search by customer name, company, email, phone, or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0 1.25rem' }}
              >
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={16} color="var(--slate-500)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                  Type:
                </span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={customerType}
                  onChange={(e) => {
                    setCustomerType(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                  Status:
                </span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer / Company</th>
                <th>Type</th>
                <th>Email & Phone</th>
                <th>GSTIN</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-primary" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ color: 'var(--slate-500)' }}>Loading customer directory...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                    No customer profiles found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const custId = c.id || c._id;
                  return (
                    <tr key={custId}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {c.customerCode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {c.displayName}
                        </div>
                        {c.companyName && c.customerType === 'business' && (
                          <div style={{ fontSize: '0.785rem', color: 'var(--slate-500)' }}>
                            {c.companyName}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: c.customerType === 'business' ? '#eff6ff' : '#f8fafc',
                            color: c.customerType === 'business' ? '#1d4ed8' : '#475569'
                          }}
                        >
                          {c.customerType === 'business' ? <Building2 size={13} /> : <User size={13} />}
                          <span style={{ textTransform: 'capitalize' }}>{c.customerType}</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-800)' }}>{c.email}</div>
                        <div style={{ fontSize: '0.785rem', color: 'var(--slate-500)' }}>
                          {c.phone || '—'}
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          {c.gstin || '—'}
                        </code>
                      </td>
                      <td>
                        <span
                          className={
                            c.status === 'active'
                              ? 'badge-active'
                              : c.status === 'suspended'
                              ? 'badge-admin'
                              : 'badge-inactive'
                          }
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/customers/${custId}`}
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            title="View Customer Profile"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </Link>

                          <Link
                            to={`/admin/customers/${custId}/edit`}
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            title="Edit Customer Details"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </Link>

                          <button
                            onClick={() => handleStatusToggle(c)}
                            className="btn btn-secondary"
                            style={{
                              width: 'auto',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.8rem',
                              color: c.status === 'active' ? 'var(--danger)' : 'var(--success)'
                            }}
                          >
                            {c.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem'
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Showing {customers.length} of {pagination.total} customers
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerList;
