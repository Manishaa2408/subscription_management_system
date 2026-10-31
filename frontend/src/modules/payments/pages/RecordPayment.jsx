import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordPayment, getDevInvoices } from '../../../services/paymentApi';
import Toast from '../../../components/Toast';

const METHOD_OPTIONS = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const Field = ({ label, children, error, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </div>
);

export default function RecordPayment() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    invoiceId: '',
    customerId: '',
    amount: '',
    paymentMethod: 'upi',
    transactionReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
    bankName: '',
    accountLast4: '',
    chequeNumber: '',
  });

  // Load invoice list for dropdown
  useEffect(() => {
    getDevInvoices()
      .then((r) => setInvoices(r.data ?? []))
      .catch(() => setInvoices([]));
  }, []);

  const handleInvoiceSelect = (e) => {
    const inv = invoices.find((i) => (i._id ?? i.id) === e.target.value);
    setSelectedInvoice(inv ?? null);
    setForm((f) => ({
      ...f,
      invoiceId: e.target.value,
      customerId: inv?.customerId ?? inv?.customer ?? '',
      amount: inv ? String(inv.totalAmount ?? inv.grandTotal ?? '') : '',
    }));
    setErrors((er) => ({ ...er, invoiceId: '', customerId: '', amount: '' }));
  };

  const change = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.invoiceId) e.invoiceId = 'Invoice is required';
    if (!form.customerId) e.customerId = 'Customer ID is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid positive amount';
    if (!form.paymentDate) e.paymentDate = 'Payment date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        invoiceId: form.invoiceId,
        customerId: form.customerId,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        transactionReference: form.transactionReference || undefined,
        paymentDate: form.paymentDate,
        notes: form.notes || undefined,
        bankDetails:
          form.paymentMethod === 'bank_transfer' || form.paymentMethod === 'cheque'
            ? {
                bankName: form.bankName || undefined,
                accountLast4: form.accountLast4 || undefined,
                chequeNumber: form.chequeNumber || undefined,
              }
            : undefined,
      };
      const res = await recordPayment(payload);
      setToast({ message: `Payment ${res.data?.paymentReference} recorded successfully!`, type: 'success' });
      setTimeout(() => navigate('/admin/payments'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to record payment';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const outstandingBalance =
    selectedInvoice
      ? (selectedInvoice.totalAmount ?? selectedInvoice.grandTotal ?? 0) -
        (selectedInvoice.paidAmount ?? 0)
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/payments')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Back to Payments
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Record Payment</h1>
          <p className="text-sm text-gray-500">Record a new customer payment against an invoice</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Invoice selector */}
          <Field label="Invoice" required error={errors.invoiceId}>
            <select
              value={form.invoiceId}
              onChange={handleInvoiceSelect}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select Invoice —</option>
              {invoices.map((inv) => (
                <option key={inv._id ?? inv.id} value={inv._id ?? inv.id}>
                  {inv.invoiceNumber ?? inv._id} — {fmt(inv.totalAmount ?? inv.grandTotal)} ({inv.status})
                </option>
              ))}
            </select>
          </Field>

          {/* Invoice summary banner */}
          {selectedInvoice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Total</span>
                <span className="font-semibold">{fmt(selectedInvoice.totalAmount ?? selectedInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Already Paid</span>
                <span className="font-semibold text-emerald-700">{fmt(selectedInvoice.paidAmount ?? 0)}</span>
              </div>
              <div className="flex justify-between mt-1 border-t border-blue-200 pt-1">
                <span className="font-medium text-gray-700">Outstanding</span>
                <span className="font-bold text-blue-700">{fmt(outstandingBalance)}</span>
              </div>
            </div>
          )}

          {/* Customer ID (auto-filled) */}
          <Field label="Customer ID" required error={errors.customerId}>
            <input
              type="text"
              value={form.customerId}
              onChange={(e) => change('customerId', e.target.value)}
              placeholder="e.g. cust_001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <Field label="Payment Amount (₹)" required error={errors.amount}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => change('amount', e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            {/* Payment Method */}
            <Field label="Payment Method" required>
              <select
                value={form.paymentMethod}
                onChange={(e) => change('paymentMethod', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Transaction Reference */}
            <Field label="Transaction Reference" error={errors.transactionReference}>
              <input
                type="text"
                value={form.transactionReference}
                onChange={(e) => change('transactionReference', e.target.value)}
                placeholder="UTR / TXN ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            {/* Payment Date */}
            <Field label="Payment Date" required error={errors.paymentDate}>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => change('paymentDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>

          {/* Bank / Cheque details (conditional) */}
          {(form.paymentMethod === 'bank_transfer' || form.paymentMethod === 'cheque') && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bank Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank Name">
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => change('bankName', e.target.value)}
                    placeholder="e.g. HDFC"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
                {form.paymentMethod === 'bank_transfer' ? (
                  <Field label="Account Last 4">
                    <input
                      type="text"
                      maxLength={4}
                      value={form.accountLast4}
                      onChange={(e) => change('accountLast4', e.target.value)}
                      placeholder="XXXX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </Field>
                ) : (
                  <Field label="Cheque Number">
                    <input
                      type="text"
                      value={form.chequeNumber}
                      onChange={(e) => change('chequeNumber', e.target.value)}
                      placeholder="e.g. 001234"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              rows={2}
              placeholder="Optional payment notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </Field>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
