import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBillingHistory } from '../../../services/billingApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import { Search, Filter, RefreshCw, FileText, Calendar } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function BillingHistory() {
  const [executions, setExecutions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [toast, setToast] = useState(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getBillingHistory({ ...filters, page, limit: 10 });
      setExecutions(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalPages: 1 });
    } catch {
      setToast({ message: 'Failed to load billing history', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin/billing" className="hover:text-blue-600">Billing Engine</Link>
              <span>/</span>
              <span>History</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Billing Execution History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive audit trail of all subscription billing events, periods, and generated invoice links
            </p>
          </div>

          <button
            onClick={() => fetchHistory(pagination.page)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by subscription, invoice ref, or source ref..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="retry_scheduled">Retry Scheduled</option>
            <option value="skipped">Skipped</option>
            <option value="processing">Processing</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', search: '' })}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Reset
          </button>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading history…</div>
          ) : executions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No billing executions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Subscription</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Billing Period</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Source Ref</th>
                    <th className="px-6 py-3">Generated Invoice</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executions.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-blue-700">{e.subscriptionId}</td>
                      <td className="px-6 py-3 text-xs text-slate-700">{e.customerId}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {new Date(e.billingPeriodStart).toLocaleDateString('en-IN')} &rarr;{' '}
                        {new Date(e.billingPeriodEnd).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{fmt(e.billingAmount)}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">{e.sourceReference}</td>
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-emerald-700">
                        {e.invoiceReference ? (
                          <Link to={`/admin/invoices/${e.invoiceId || ''}`} className="hover:underline">
                            {e.invoiceReference}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '—'}
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
                  onClick={() => fetchHistory(pagination.page - 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchHistory(pagination.page + 1)}
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
