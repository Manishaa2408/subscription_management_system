import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayments } from '../../../services/paymentApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const statusColors = {
  pending: 'amber', completed: 'emerald', failed: 'rose',
  cancelled: 'slate', refunded: 'purple', partially_refunded: 'indigo',
};

export default function CustomerPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPayments({ page, limit: 10 });
      setPayments(res.data?.payments ?? []);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
    } catch {
      setToast({ message: 'Failed to load your payments', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your complete payment history</p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Paid', value: fmt(totalPaid), color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
            { label: 'Total Transactions', value: String(payments.length), color: 'bg-blue-50 border-blue-200 text-blue-800' },
            {
              label: 'Pending',
              value: String(payments.filter((p) => p.status === 'pending').length),
              color: 'bg-amber-50 border-amber-200 text-amber-800',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p>No payments found</p>
              <p className="text-xs mt-1">Payments will appear here once recorded</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Reference', 'Invoice', 'Amount', 'Method', 'Date', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-700 text-xs">{p.paymentReference}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.invoiceId}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} color={statusColors[p.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/customer/payments/${p._id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </Link>
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
