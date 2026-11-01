import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFailedBillings, processSubscriptionBilling } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { AlertCircle, RefreshCw, Play, Search, Clock } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function FailedBillings() {
  const [failedList, setFailedList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [retryTarget, setRetryTarget] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchFailed = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getFailedBillings({ search, page, limit: 10 });
      setFailedList(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalPages: 1 });
    } catch {
      setToast({ message: 'Failed to load failed billing executions', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFailed(1);
  }, [fetchFailed]);

  const handleRetrySingle = async () => {
    if (!retryTarget) return;
    setRetrying(true);
    try {
      const res = await processSubscriptionBilling(retryTarget.subscriptionId);
      const outcome = res.data?.result;
      setToast({
        message: `Retry outcome: ${outcome?.status} - ${outcome?.invoiceNumber ? 'Invoice ' + outcome.invoiceNumber : outcome?.error || outcome?.reason || 'Processed'}`,
        type: outcome?.status === 'success' ? 'success' : 'error'
      });
      setRetryTarget(null);
      fetchFailed(pagination.page);
    } catch (err) {
      setToast({ message: err.message || 'Retry failed', type: 'error' });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin/billing" className="hover:text-blue-600">Billing Engine</Link>
              <span>/</span>
              <span>Failed Executions</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Failed & Retry-Scheduled Billings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review exceptions, investigate rejection reasons, and manually retry eligible executions
            </p>
          </div>

          <button
            onClick={() => fetchFailed(pagination.page)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by subscription, customer, or source reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
        </div>

        {/* Failed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading failed executions…</div>
          ) : failedList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="text-base font-semibold text-slate-700">No failed billing executions</p>
              <p className="text-xs text-slate-400 mt-1">All recurring billing operations have succeeded or are pending run.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Subscription</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Attempt</th>
                    <th className="px-6 py-3">Failure Reason</th>
                    <th className="px-6 py-3">Next Retry</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedList.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">{f.subscriptionId}</td>
                      <td className="px-6 py-3 text-xs text-slate-700">{f.customerId}</td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{fmt(f.billingAmount)}</td>
                      <td className="px-6 py-3 text-xs font-semibold text-slate-600">
                        Attempt {f.attemptCount}
                      </td>
                      <td className="px-6 py-3 text-xs text-rose-600 max-w-[250px] truncate" title={f.errorMessage}>
                        {f.errorMessage || 'Unknown billing error'}
                      </td>
                      <td className="px-6 py-3 text-xs text-amber-700 font-medium">
                        {f.nextRetryAt ? new Date(f.nextRetryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Manual Only'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setRetryTarget(f)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition"
                        >
                          <Play className="w-3 h-3" />
                          Retry
                        </button>
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
                  onClick={() => fetchFailed(pagination.page - 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchFailed(pagination.page + 1)}
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
        isOpen={Boolean(retryTarget)}
        title="Retry Billing Execution?"
        message={`Retry billing subscription ${retryTarget?.subscriptionId}? The existing idempotency key will be reused.`}
        confirmText={retrying ? 'Retrying…' : 'Execute Retry'}
        confirmVariant="danger"
        onConfirm={handleRetrySingle}
        onCancel={() => setRetryTarget(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
