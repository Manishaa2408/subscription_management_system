import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getPayments,
  getAnalyticsSummary,
  verifyPayment,
  failPayment,
} from '../../../services/paymentApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/common/StatCard';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Plus, Search, Filter, RotateCcw, CheckCircle, Clock, AlertTriangle, IndianRupee, Eye, Check, X
} from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
const METHOD_OPTIONS = ['', 'upi', 'bank_transfer', 'card', 'cash', 'cheque', 'other'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [filters, setFilters] = useState({ status: '', paymentMethod: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters };
      Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
      const [pRes, aRes] = await Promise.all([
        getPayments(params),
        getAnalyticsSummary(),
      ]);
      setPayments(pRes.data?.payments ?? []);
      setTotalPages(pRes.data?.pagination?.totalPages ?? 1);
      setAnalytics(aRes.data ?? null);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleAction = (type, payment) => {
    setConfirm({
      title: type === 'verify' ? 'Verify Payment' : 'Mark as Failed',
      message: `Are you sure you want to ${type === 'verify' ? 'verify' : 'mark as failed'} payment ${payment.paymentReference}?`,
      variant: type === 'verify' ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          if (type === 'verify') await verifyPayment(payment._id);
          else await failPayment(payment._id);
          showToast(`Payment ${type === 'verify' ? 'verified' : 'marked as failed'} successfully`);
          load();
        } catch (e) {
          showToast(e.response?.data?.message ?? 'Action failed', 'error');
        }
      },
    });
  };

  const statusColors = {
    pending: 'amber', completed: 'emerald', failed: 'rose',
    cancelled: 'slate', refunded: 'purple', partially_refunded: 'indigo',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Payment & Collections"
        subtitle="Record received payments, reconcile invoices, and monitor collection statuses."
        action={
          <Link
            to="/admin/payments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </Link>
        }
      />

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Collected"
            value={fmt(analytics.totalCollected)}
            change={`${analytics.completedCount ?? 0} completed`}
            icon={IndianRupee}
            color="emerald"
          />
          <StatCard
            label="Pending Verification"
            value={fmt(analytics.pendingAmount)}
            change={`${analytics.pendingCount ?? 0} payments`}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Refunded"
            value={fmt(analytics.refundedAmount)}
            change={`${analytics.refundedCount ?? 0} refunds`}
            icon={AlertTriangle}
            color="purple"
          />
          <StatCard
            label="Failed Transactions"
            value={String(analytics.failedCount ?? 0)}
            change="Re-attempt required"
            icon={AlertTriangle}
            color="rose"
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference / customer..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filters.status}
              onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Statuses'}</option>
              ))}
            </select>
          </div>

          <select
            value={filters.paymentMethod}
            onChange={(e) => { setFilters((f) => ({ ...f, paymentMethod: e.target.value })); setPage(1); }}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700 capitalize"
          >
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m ? m.replace('_', ' ') : 'All Payment Methods'}</option>
            ))}
          </select>

          {(filters.search || filters.status || filters.paymentMethod) && (
            <button
              onClick={() => { setFilters({ status: '', paymentMethod: '', search: '' }); setPage(1); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading payments..." />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments recorded"
            description="No customer payments match your search and filter criteria."
            actionText="Record Payment"
            onAction={() => window.location.href = "/admin/payments/create"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-blue-600">
                      <Link to={`/admin/payments/${p._id}`} className="hover:underline">
                        {p.paymentReference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">{p.customerId}</td>
                    <td className="px-5 py-4 font-mono text-slate-500 text-xs">{p.invoiceId}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{fmt(p.amount)}</td>
                    <td className="px-5 py-4 capitalize text-slate-600 text-xs">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={p.status} color={statusColors[p.status]} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/payments/${p._id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction('verify', p)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Verify Payment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction('fail', p)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Mark Failed"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <div>Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
