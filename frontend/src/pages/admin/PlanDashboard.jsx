import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import planService from '../../services/planService';
import {
  Package,
  Plus,
  Eye,
  Edit2,
  Archive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

const PlanDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await planService.listPlans({ page: pagination.page, limit: pagination.limit });
      if (res && res.data) {
        setPlans(res.data.plans || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [pagination.page]);

  const toggleStatus = async (plan) => {
    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Change status of ${plan.name} to ${newStatus}?`)) return;
    try {
      await planService.changePlanStatus(plan._id, newStatus);
      setAlert({ type: 'success', message: `Status of ${plan.name} updated to ${newStatus}` });
      fetchPlans();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || err.message });
    }
  };

  const archive = async (plan) => {
    if (!window.confirm(`Archive plan ${plan.name}? This cannot be undone.`)) return;
    try {
      await planService.archivePlan(plan._id);
      setAlert({ type: 'success', message: `Plan ${plan.name} archived` });
      fetchPlans();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || err.message });
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      (p.productId?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure pricing tiers, billing cadences, and subscription packages
          </p>
        </div>

        <Link
          to="/admin/plans/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </Link>
      </div>

      {/* Alert Banner */}
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

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            placeholder="Search plans by name, code, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {filteredPlans.length} active catalog items
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Billing Cadence</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs font-medium">Loading subscription plans...</span>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No plans found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click "Create Plan" above to create your first plan tier.</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => {
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.description && (
                          <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{p.description}</p>
                        )}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                          {p.code}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{p.productId?.name || p.productId || 'Core Service'}</span>
                        </span>
                      </td>

                      {/* Billing Frequency */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium capitalize">
                          <Repeat className="w-3.5 h-3.5 text-slate-400" />
                          Every {p.billingInterval > 1 ? `${p.billingInterval} ` : ''}{p.billingFrequency}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">
                          {p.currency === 'INR' ? '₹' : p.currency}{' '}
                          {Number(p.price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-400 font-normal"> / {p.billingFrequency}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : p.status === 'archived' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Archived
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
                            to={`/admin/plans/${p._id}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => toggleStatus(p)}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              p.status === 'active'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>

                          {p.status !== 'archived' && (
                            <button
                              onClick={() => archive(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Archive Plan"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
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
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanDashboard;
