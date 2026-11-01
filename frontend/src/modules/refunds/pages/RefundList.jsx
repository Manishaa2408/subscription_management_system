import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getRefunds, createRefund } from '../../../services/paymentApi';
import Toast from '../../../components/Toast';
import StatusBadge from '../../../components/StatusBadge';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const REFUND_STATUS_COLORS = { pending: 'amber', completed: 'emerald', failed: 'rose', cancelled: 'slate' };

export default function RefundList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillPaymentId = searchParams.get('paymentId') ?? '';

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(!!prefillPaymentId);

  const [form, setForm] = useState({
    paymentId: prefillPaymentId,
    amount: '',
    reason: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRefunds({ page, limit: 10 });
      setRefunds(res.data?.refunds ?? []);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
    } catch {
      showToast('Failed to load refunds', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.paymentId) e.paymentId = 'Payment ID is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid positive amount';
    if (!form.reason) e.reason = 'Reason is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createRefund({
        paymentId: form.paymentId,
        amount: Number(form.amount),
        reason: form.reason,
        notes: form.notes || undefined,
      });
      showToast(`Refund ${res.data?.refundReference} created`);
      setForm({ paymentId: '', amount: '', reason: '', notes: '' });
      setCreateOpen(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to create refund', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and issue payment refunds</p>
          </div>
          <button
            onClick={() => setCreateOpen((o) => !o)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Issue Refund
          </button>
        </div>

        {/* Create refund panel */}
        {createOpen && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-rose-200 p-5 mb-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Issue New Refund</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment ID *</label>
                <input
                  type="text"
                  value={form.paymentId}
                  onChange={(e) => setForm((f) => ({ ...f, paymentId: e.target.value }))}
                  placeholder="MongoDB _id of payment"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {formErrors.paymentId && <p className="text-xs text-rose-500 mt-0.5">{formErrors.paymentId}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {formErrors.amount && <p className="text-xs text-rose-500 mt-0.5">{formErrors.amount}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason *</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Customer cancelled subscription"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {formErrors.reason && <p className="text-xs text-rose-500 mt-0.5">{formErrors.reason}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional internal notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Creating…' : 'Issue Refund'}
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
          ) : refunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p>No refunds recorded</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Refund Ref', 'Payment ID', 'Amount', 'Reason', 'Status', 'Created'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refunds.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-rose-700 text-xs">{r.refundReference}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{r.paymentId?._id ?? r.paymentId}</td>
                    <td className="px-4 py-3 font-semibold text-rose-700">{fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{r.reason}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} color={REFUND_STATUS_COLORS[r.status]} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
    </div>
  );
}
