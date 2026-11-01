import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getPaymentById,
  verifyPayment,
  failPayment,
  getReceiptByPaymentId,
} from '../../../services/paymentApi';
import StatusBadge from '../../../components/StatusBadge';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
  </div>
);

const statusColors = {
  pending: 'amber', completed: 'emerald', failed: 'rose',
  cancelled: 'slate', refunded: 'purple', partially_refunded: 'indigo',
};

export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.allSettled([
        getPaymentById(id),
        getReceiptByPaymentId(id),
      ]);
      if (pRes.status === 'fulfilled') setPayment(pRes.value.data);
      if (rRes.status === 'fulfilled') setReceipt(rRes.value.data);
    } catch {
      setToast({ message: 'Failed to load payment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const doAction = (type) => {
    setConfirm({
      title: type === 'verify' ? 'Verify Payment' : 'Mark as Failed',
      message: `Are you sure you want to ${type === 'verify' ? 'verify' : 'mark as failed'} this payment?`,
      variant: type === 'verify' ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          if (type === 'verify') await verifyPayment(id);
          else await failPayment(id);
          setToast({ message: `Payment ${type === 'verify' ? 'verified' : 'marked as failed'}`, type: 'success' });
          load();
        } catch (e) {
          setToast({ message: e.response?.data?.message ?? 'Action failed', type: 'error' });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <p className="text-gray-400">Loading payment…</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Payment not found</p>
        <button onClick={() => navigate('/admin/payments')} className="text-blue-600 text-sm hover:underline">
          ← Back to Payments
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/admin/payments')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              ← Back to Payments
            </button>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{payment.paymentReference}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={payment.status} color={statusColors[payment.status]} />
              <span className="text-sm text-gray-500 capitalize">{payment.paymentMethod?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{fmt(payment.amount)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        {payment.status === 'pending' && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => doAction('verify')}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
            >
              ✓ Verify Payment
            </button>
            <button
              onClick={() => doAction('fail')}
              className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700"
            >
              ✗ Mark as Failed
            </button>
          </div>
        )}

        {/* Receipt link */}
        {receipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">Receipt Generated</p>
              <p className="text-xs text-emerald-600 font-mono">{receipt.receiptNumber}</p>
            </div>
            <Link
              to={`/admin/payments/receipt/${receipt._id}`}
              className="text-sm text-emerald-700 hover:text-emerald-900 font-medium underline"
            >
              View Receipt →
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Payment Details</h2>
            <InfoRow label="Payment Reference" value={payment.paymentReference} mono />
            <InfoRow label="Invoice ID" value={payment.invoiceId} mono />
            <InfoRow label="Customer ID" value={payment.customerId} mono />
            <InfoRow label="Amount" value={fmt(payment.amount)} />
            <InfoRow label="Method" value={payment.paymentMethod?.replace('_', ' ')} />
            <InfoRow label="Transaction Ref" value={payment.transactionReference} mono />
            <InfoRow label="Status" value={payment.status} />
            <InfoRow
              label="Payment Date"
              value={payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : null}
            />
          </div>

          {/* Bank / Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Additional Info</h2>
            {payment.bankDetails?.bankName && (
              <InfoRow label="Bank" value={payment.bankDetails.bankName} />
            )}
            {payment.bankDetails?.accountLast4 && (
              <InfoRow label="Account (Last 4)" value={`****${payment.bankDetails.accountLast4}`} mono />
            )}
            {payment.bankDetails?.chequeNumber && (
              <InfoRow label="Cheque No." value={payment.bankDetails.chequeNumber} mono />
            )}
            <InfoRow label="Reconciliation" value={payment.reconciliationStatus ?? 'unmatched'} />
            <InfoRow label="Created At" value={payment.createdAt ? new Date(payment.createdAt).toLocaleString('en-IN') : null} />
            {payment.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{payment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Refund section */}
        {(payment.status === 'completed' || payment.status === 'partially_refunded') && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Refunds</h2>
              <Link
                to={`/admin/refunds/create?paymentId=${payment._id}`}
                className="text-sm text-rose-600 hover:text-rose-800 font-medium"
              >
                + Issue Refund
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Refunded: {fmt(payment.refundedAmount ?? 0)} / {fmt(payment.amount)}
            </p>
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
