import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBillingRuns } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import { RefreshCw, Zap, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BillingRuns() {
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', triggerType: '', search: '' });
  const [toast, setToast] = useState(null);

  const fetchRuns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getBillingRuns({ ...filters, page, limit: 10 });
      setRuns(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalPages: 1 });
    } catch {
      setToast({ message: 'Failed to load billing runs', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRuns(1);
  }, [fetchRuns]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin/billing" className="hover:text-blue-600">Billing Engine</Link>
              <span>/</span>
              <span>Billing Runs</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Billing Runs</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical batches of scheduled, manual, and retry billing executions
            </p>
          </div>

          <button
            onClick={() => fetchRuns(pagination.page)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search run reference (e.g. RUN-2026-0001)..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <select
            value={filters.triggerType}
            onChange={(e) => setFilters((f) => ({ ...f, triggerType: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Trigger Types</option>
            <option value="scheduled">Scheduled</option>
            <option value="manual">Manual</option>
            <option value="retry">Retry</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="completed_with_errors">With Errors</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', triggerType: '', search: '' })}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Reset
          </button>
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading runs…</div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No billing runs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Run Reference</th>
                    <th className="px-6 py-3">Trigger</th>
                    <th className="px-6 py-3">Started</th>
                    <th className="px-6 py-3">Candidates</th>
                    <th className="px-6 py-3">Success</th>
                    <th className="px-6 py-3">Failed</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">
                        <Link to={`/admin/billing/runs/${r._id}`} className="hover:underline">
                          {r.runReference}
                        </Link>
                      </td>
                      <td className="px-6 py-3 capitalize text-slate-700 text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                          {r.triggerType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {r.startedAt ? new Date(r.startedAt).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-800 font-semibold">{r.totalExamined}</td>
                      <td className="px-6 py-3 text-emerald-600 font-semibold">{r.successCount}</td>
                      <td className="px-6 py-3 text-rose-600 font-semibold">{r.failedCount}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/admin/billing/runs/${r._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
                  onClick={() => fetchRuns(pagination.page - 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchRuns(pagination.page + 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
