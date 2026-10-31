import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import customerService from '../../services/customerService';
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ShieldAlert,
  ArrowUpDown
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
        search: search.trim() || undefined,
        customerType: customerType || undefined,
        status: status || undefined,
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

  // Helper for initials avatar
  const getInitials = (name = 'Customer') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Client accounts, corporate tax profiles, and service authorizations
          </p>
        </div>

        <Link
          to="/admin/customers/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </Link>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="p-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder="Search by customer name, company, email, phone, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
            <select
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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

          {(search || customerType || status) && (
            <button
              onClick={() => {
                setSearch('');
                setCustomerType('');
                setStatus('');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Aesthetic Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs font-medium">Loading customer directory...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No customers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try refining your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const custId = c.id || c._id;
                  const isBusiness = c.customerType === 'business';

                  return (
                    <tr key={custId} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-md">
                          {c.customerCode}
                        </span>
                      </td>

                      {/* Customer Name & Initials */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {getInitials(c.displayName)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/customers/${custId}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition truncate block"
                            >
                              {c.displayName}
                            </Link>
                            {c.companyName && isBusiness && (
                              <span className="text-xs text-slate-400 truncate block">
                                {c.companyName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            isBusiness
                              ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isBusiness ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          <span className="capitalize">{c.customerType || 'Individual'}</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-800 font-medium">{c.email}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.phone || '—'}</div>
                      </td>

                      {/* GSTIN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-600">
                          {c.gstin || '—'}
                        </span>
                      </td>

                      {/* Status Badge with dot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : c.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/admin/customers/${custId}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Customer Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/admin/customers/${custId}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleStatusToggle(c)}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              c.status === 'active'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
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

        {/* Clean Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-700">{customers.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{pagination.total}</span> customers
            </span>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="px-2 text-slate-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
