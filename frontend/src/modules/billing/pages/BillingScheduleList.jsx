import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBillingSchedules, processSubscriptionBilling } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { Search, Filter, Play, Calendar, RefreshCw } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function BillingScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', billingFrequency: '', status: '' });
  const [toast, setToast] = useState(null);
  const [actionSchedule, setActionSchedule] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchSchedules = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getBillingSchedules({ ...filters, page, limit: 10 });
      setSchedules(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalPages: 1 });
    } catch {
      setToast({ message: 'Failed to load billing schedules', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSchedules(1);
  }, [fetchSchedules]);

  const handleProcessSingle = async () => {
    if (!actionSchedule) return;
    setProcessing(true);
    try {
      const res = await processSubscriptionBilling(actionSchedule.subscriptionId);
      const outcome = res.data?.result;
      if (outcome?.status === 'success') {
        setToast({
          message: `Subscription ${actionSchedule.subscriptionId} billed! Invoice ${outcome.invoiceNumber || ''} generated.`,
          type: 'success'
        });
      } else {
        setToast({
          message: `Billing outcome: ${outcome?.status} - ${outcome?.reason || outcome?.error || 'Processed'}`,
          type: outcome?.status === 'failed' ? 'error' : 'success'
        });
      }
      setActionSchedule(null);
      fetchSchedules(pagination.page);
    } catch (err) {
      setToast({ message: err.message || 'Failed to process subscription billing', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin/billing" className="hover:text-blue-600">Billing Engine</Link>
              <span>/</span>
              <span>Schedules</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Billing Schedules</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active recurring calculation schedules for subscriptions across daily, weekly, monthly, and yearly cycles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/billing"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Subscription ID or Customer ID..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={filters.billingFrequency}
            onChange={(e) => setFilters((f) => ({ ...f, billingFrequency: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => setFilters({ search: '', billingFrequency: '', status: '' })}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Reset
          </button>
        </div>

        {/* Schedules Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading schedules…</div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-base font-semibold text-slate-700">No billing schedules found</p>
              <p className="text-xs text-slate-400 mt-1">Schedules are created automatically when subscriptions are confirmed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Subscription</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Frequency</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Next Billing Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">
                        <Link to={`/admin/billing/schedules/${s._id}`} className="hover:underline">
                          {s.subscriptionId}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-700 text-xs">{s.customerId}</td>
                      <td className="px-6 py-3 capitalize text-slate-600">
                        {s.billingInterval > 1 ? `Every ${s.billingInterval} ` : ''}
                        {s.billingFrequency}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{fmt(s.amountSnapshot)}</td>
                      <td className="px-6 py-3 text-xs text-slate-600 font-medium">
                        {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActionSchedule(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                            title="Trigger billing execution for this subscription"
                          >
                            <Play className="w-3 h-3" />
                            Bill Now
                          </button>
                          <Link
                            to={`/admin/billing/schedules/${s._id}`}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchSchedules(pagination.page - 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchSchedules(pagination.page + 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(actionSchedule)}
        title="Trigger Subscription Billing?"
        message={`Are you sure you want to process billing for subscription ${actionSchedule?.subscriptionId}? An idempotency key will be verified and an invoice request dispatched.`}
        confirmText={processing ? 'Processing…' : 'Process Billing'}
        confirmVariant="primary"
        onConfirm={handleProcessSingle}
        onCancel={() => setActionSchedule(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
