import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPrintableReceipt } from '../../../services/paymentApi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

export default function PaymentReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    getPrintableReceipt(id)
      .then((r) => setReceipt(r.data))
      .catch(() => setReceipt(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; max-width: 480px; margin: 0 auto; padding: 24px; font-size: 13px; color: #111; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #999; margin: 12px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .amount { font-size: 20px; font-weight: bold; }
        @media print { button { display: none; } }
      </style></head>
      <body>${content}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading receipt…</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Receipt not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm hover:underline">← Go back</button>
      </div>
    );
  }

  const p = receipt.paymentId ?? {};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* Actions bar */}
      <div className="w-full max-w-lg flex justify-between mb-4 px-2">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
        >
          🖨 Print Receipt
        </button>
      </div>

      {/* Receipt card */}
      <div
        ref={printRef}
        className="w-full max-w-lg bg-white shadow-lg rounded-xl overflow-hidden"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {/* Header */}
        <div className="bg-blue-700 text-white text-center py-6 px-6">
          <p className="text-xs uppercase tracking-widest opacity-80">Brightloop Software</p>
          <p className="text-2xl font-bold mt-1">PAYMENT RECEIPT</p>
          <p className="text-xs opacity-70 mt-0.5">GSTIN: 32AABCB1234D1Z8 | Kerala, India</p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {/* Receipt & payment reference */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Receipt No.</p>
            <p className="text-xl font-bold text-blue-700">{receipt.receiptNumber}</p>
            <p className="text-xs text-gray-400 mt-1">
              Issued: {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString('en-IN') : '—'}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Ref</span>
              <span className="font-mono font-semibold">{receipt.paymentReference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice ID</span>
              <span className="font-mono">{receipt.invoiceId ?? p.invoiceId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-mono">{receipt.customerId ?? p.customerId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="capitalize">{(receipt.paymentMethod ?? p.paymentMethod ?? '').replace('_', ' ')}</span>
            </div>
            {(receipt.transactionReference || p.transactionReference) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction Ref</span>
                <span className="font-mono text-xs">{receipt.transactionReference ?? p.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Date</span>
              <span>
                {(receipt.paymentDate ?? p.paymentDate)
                  ? new Date(receipt.paymentDate ?? p.paymentDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                  : '—'}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="border-t border-dashed border-gray-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Amount Received</span>
              <span className="text-3xl font-bold text-emerald-700">
                {fmt(receipt.amount ?? p.amount)}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-right mt-0.5">Indian Rupees (INR)</p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
              ✓ Payment Confirmed
            </span>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-3">{receipt.notes}</div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 text-center px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Thank you for your payment.</p>
          <p className="text-xs text-gray-400">This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}
