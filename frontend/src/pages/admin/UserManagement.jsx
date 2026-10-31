import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import Navbar from '../../components/common/Navbar';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Eye,
  Shield,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page: pagination.page,
        limit: 10,
      });

      if (res && res.data) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} account for ${user.fullName}?`)) {
      return;
    }

    try {
      await authService.updateUserStatus(user.id, newStatus);
      setAlert({
        type: 'success',
        message: `Account for ${user.fullName} successfully ${newStatus ? 'activated' : 'deactivated'}.`,
      });
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update status' });
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    if (!window.confirm(`Change role of ${user.fullName} from ${user.role} to ${newRole}?`)) {
      return;
    }

    try {
      await authService.updateUserRole(user.id, newRole);
      setAlert({
        type: 'success',
        message: `Role for ${user.fullName} updated to ${newRole}.`,
      });
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to change role' });
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError('');

    if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password) {
      setStaffError('Please provide full name, email and password.');
      return;
    }

    if (staffForm.password !== staffForm.confirmPassword) {
      setStaffError('Passwords do not match.');
      return;
    }

    try {
      setStaffSubmitting(true);
      await authService.createStaff(staffForm);
      setShowStaffModal(false);
      setStaffForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setAlert({ type: 'success', message: 'Staff account created successfully.' });
      fetchUsers();
    } catch (err) {
      setStaffError(err.message || 'Failed to create staff account.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">
              Manage internal staff, administrators, and customer platform accounts.
            </p>
          </div>

          <button
            onClick={() => setShowStaffModal(true)}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            <UserPlus size={18} />
            <span>Create Staff</span>
          </button>
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

        {/* Filters and Search Bar */}
        <div
          className="dashboard-card"
          style={{ marginBottom: '1.5rem', padding: '1.25rem' }}
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '260px' }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon-left">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-input has-left-icon"
                  placeholder="Search by full name or email address..."
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
                  Role:
                </span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                  Status:
                </span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-primary" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ color: 'var(--slate-500)' }}>Loading users from database...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{u.email}</div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className={`nav-badge badge-${u.role}`}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        <option value="customer">CUSTOMER</option>
                        <option value="staff">STAFF</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                    <td>
                      <span className={u.isActive ? 'badge-active' : 'badge-inactive'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="btn btn-secondary"
                          style={{
                            width: 'auto',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8rem',
                          }}
                          title="View user details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            width: 'auto',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8rem',
                            borderColor: u.isActive ? 'var(--slate-300)' : 'transparent',
                            color: u.isActive ? 'var(--danger)' : '#ffffff',
                          }}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              marginTop: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Showing {users.length} of {pagination.total} users
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

        {/* Create Staff Modal */}
        {showStaffModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>Create Staff Account</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)' }}>
                    Staff accounts have access to operational day-to-day features.
                  </p>
                </div>
                <button
                  onClick={() => setShowStaffModal(false)}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>

              {staffError && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{staffError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Staff Member Name"
                    value={staffForm.fullName}
                    onChange={(e) =>
                      setStaffForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="staff@brightloop.com"
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 9876543210"
                    value={staffForm.phone}
                    onChange={(e) =>
                      setStaffForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Must meet security criteria"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Temporary Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm password"
                    value={staffForm.confirmPassword}
                    onChange={(e) =>
                      setStaffForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    marginTop: '1.5rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="btn btn-secondary"
                    style={{ width: 'auto' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: 'auto' }}
                    disabled={staffSubmitting}
                  >
                    {staffSubmitting ? 'Creating...' : 'Create Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View User Details Modal */}
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                    }}
                  >
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem' }}>{selectedUser.fullName}</h4>
                    <span className={`nav-badge badge-${selectedUser.role}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--slate-200)',
                    paddingTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Mail size={16} color="var(--slate-400)" />
                    <span style={{ color: 'var(--slate-500)', width: '90px' }}>Email:</span>
                    <strong>{selectedUser.email}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Phone size={16} color="var(--slate-400)" />
                    <span style={{ color: 'var(--slate-500)', width: '90px' }}>Phone:</span>
                    <span>{selectedUser.phone || 'Not provided'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Shield size={16} color="var(--slate-400)" />
                    <span style={{ color: 'var(--slate-500)', width: '90px' }}>Status:</span>
                    <span className={selectedUser.isActive ? 'badge-active' : 'badge-inactive'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Calendar size={16} color="var(--slate-400)" />
                    <span style={{ color: 'var(--slate-500)', width: '90px' }}>Created:</span>
                    <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--slate-500)', width: '90px', paddingLeft: '1.6rem' }}>
                      User ID:
                    </span>
                    <code style={{ fontSize: '0.8rem', background: 'var(--slate-100)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {selectedUser.id}
                    </code>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="btn btn-secondary"
                    style={{ width: 'auto' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
