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

const STATUS_OPTIONS = ['', 'pending', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
const METHOD_OPTIONS = ['', 'upi', 'bank_transfer', 'card', 'cash', 'cheque', 'other'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const AnalyticsCard = ({ label, value, sub, color }) => (
  <div className={`bg-white rounded-xl border-l-4 ${color} p-4 shadow-sm`}>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and reconcile all customer payments</p>
          </div>
          <Link
            to="/admin/payments/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Record Payment
          </Link>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <AnalyticsCard
              label="Total Collected"
              value={fmt(analytics.totalCollected)}
              sub={`${analytics.completedCount ?? 0} completed`}
              color="border-emerald-500"
            />
            <AnalyticsCard
              label="Pending"
              value={fmt(analytics.pendingAmount)}
              sub={`${analytics.pendingCount ?? 0} payments`}
              color="border-amber-500"
            />
            <AnalyticsCard
              label="Refunded"
              value={fmt(analytics.refundedAmount)}
              sub={`${analytics.refundedCount ?? 0} refunds`}
              color="border-purple-500"
            />
            <AnalyticsCard
              label="Failed"
              value={String(analytics.failedCount ?? 0)}
              sub="transactions"
              color="border-rose-500"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search reference / customer..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
          <select
            value={filters.paymentMethod}
            onChange={(e) => { setFilters((f) => ({ ...f, paymentMethod: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m || 'All Methods'}</option>
            ))}
          </select>
          <button
            onClick={() => { setFilters({ status: '', paymentMethod: '', search: '' }); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg"
          >
            Clear
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading payments…</div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-lg">No payments found</p>
              <Link to="/admin/payments/create" className="mt-2 text-blue-600 text-sm hover:underline">
                Record the first payment
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Reference', 'Customer', 'Invoice', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-700">
                      <Link to={`/admin/payments/${p._id}`} className="hover:underline">
                        {p.paymentReference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.customerId}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.invoiceId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} color={statusColors[p.status]} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/payments/${p._id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                        </Link>
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction('verify', p)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleAction('fail', p)}
                              className="text-rose-600 hover:text-rose-800 text-xs font-medium"
                            >
                              Fail
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
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
