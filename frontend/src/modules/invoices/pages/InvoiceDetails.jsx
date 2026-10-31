import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../../services/invoiceApi';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge } from '../../../components/StatusBadge';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  FileEdit,
  CreditCard,
  Building,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';
  const isCustomer = currentUser.role === 'customer';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getInvoiceById(id);
      setInvoice(res.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message, errors: err.errors });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id, currentUser]);

  const handleIssue = () => {
    setModalConfig({
      isOpen: true,
      title: 'Issue Invoice',
      message: `Are you sure you want to officially issue ${invoice.invoiceNumber}? The financial values will be permanently locked.`,
      confirmText: 'Confirm Issue',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await invoiceApi.issueInvoice(invoice._id);
          setToast({ type: 'success', message: 'Invoice issued successfully!' });
          fetchInvoice();
        } catch (err) {
          setToast({ type: 'error', message: err.message, errors: err.errors });
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: 'Cancel Invoice',
      message: `Please specify a cancellation reason for audit purposes:`,
      confirmText: 'Cancel Invoice',
      confirmVariant: 'danger',
      requiresInput: true,
      inputLabel: 'Cancellation Reason',
      inputPlaceholder: 'Reason for cancellation...',
      onConfirm: async (reason) => {
        try {
          await invoiceApi.cancelInvoice(invoice._id, reason);
          setToast({ type: 'success', message: 'Invoice cancelled successfully.' });
          fetchInvoice();
        } catch (err) {
          setToast({ type: 'error', message: err.message, errors: err.errors });
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setToast({ type: 'error', message: 'Please enter a valid positive payment amount.' });
      return;
    }

    try {
      await invoiceApi.recordPayment(invoice._id, {
        amount,
        paymentMethod,
        transactionReference: `PAY-MANUAL-${Date.now()}`
      });

      setToast({ type: 'success', message: `Recorded payment of ₹${amount.toLocaleString('en-IN')}` });
      setShowPaymentModal(false);
      setPaymentAmount('');
      fetchInvoice();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <Clock className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        Loading invoice details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Invoice Not Found</h2>
        <p className="text-slate-500 mt-1">You may not have permission to view this invoice or it does not exist.</p>
        <Link
          to={isCustomer ? '/customer/invoices' : '/admin/invoices'}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>
    );
  }

  const isIntraState = invoice.taxBreakdown?.cgstTotal > 0 || invoice.taxBreakdown?.sgstTotal > 0;
  const isDraft = invoice.status === 'draft';
  const isCancelled = invoice.status === 'cancelled';
  const isPaid = invoice.status === 'paid';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to={isCustomer ? '/customer/invoices' : '/admin/invoices'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.effectiveStatus || invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {new Date(invoice.issueDate).toLocaleDateString()} &bull; Due on{' '}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/invoices/${invoice._id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl shadow-2xs transition"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </Link>

          {isAdmin && isDraft && (
            <>
              <Link
                to={`/admin/invoices/${invoice._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium rounded-xl shadow-2xs transition"
              >
                <FileEdit className="w-4 h-4" />
                Edit Draft
              </Link>

              <button
                onClick={handleIssue}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
              >
                <CheckCircle className="w-4 h-4" />
                Issue Invoice
              </button>
            </>
          )}

          {isAdmin && !isDraft && !isCancelled && !isPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          {isAdmin && (isDraft || invoice.status === 'issued') && invoice.amountPaid === 0 && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-medium rounded-xl transition"
            >
              <XCircle className="w-4 h-4" />
              Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Invoice Cancelled</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Reason: {invoice.cancellationReason || 'No reason provided'} &bull; Cancelled on{' '}
              {invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Customer & Supplier Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Customer Information
            </span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md">
              {invoice.customerSnapshot?.state || 'Kerala'} ({isIntraState ? 'Intra-State GST' : 'Inter-State IGST'})
            </span>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="font-bold text-slate-900 text-base">{invoice.customerSnapshot?.name}</div>
            <div className="text-slate-600">{invoice.customerSnapshot?.email}</div>
            {invoice.customerSnapshot?.phone && (
              <div className="text-slate-500 text-xs">Phone: {invoice.customerSnapshot.phone}</div>
            )}
            <div className="text-slate-600 text-xs mt-2">
              <span className="font-medium text-slate-700">Billing Address:</span>{' '}
              {invoice.customerSnapshot?.billingAddress?.line1 && `${invoice.customerSnapshot.billingAddress.line1}, `}
              {invoice.customerSnapshot?.billingAddress?.city && `${invoice.customerSnapshot.billingAddress.city}, `}
              {invoice.customerSnapshot?.billingAddress?.state} - {invoice.customerSnapshot?.billingAddress?.postalCode}
            </div>
            {invoice.customerSnapshot?.gstin ? (
              <div className="text-xs text-slate-700 font-semibold pt-1">
                GSTIN: <span className="font-mono text-blue-600">{invoice.customerSnapshot.gstin}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic pt-1">Unregistered Consumer (No GSTIN)</div>
            )}
          </div>
        </div>

        {/* Supplier Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-600" /> Supplier (Brightloop)
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
              State: {invoice.supplierSnapshot?.state || 'Kerala'}
            </span>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="font-bold text-slate-900 text-base">{invoice.supplierSnapshot?.name}</div>
            <div className="text-slate-600">{invoice.supplierSnapshot?.email}</div>
            <div className="text-slate-500 text-xs">{invoice.supplierSnapshot?.address}</div>
            <div className="text-xs text-slate-700 font-semibold pt-2">
              GSTIN: <span className="font-mono text-blue-600">{invoice.supplierSnapshot?.gstin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Invoice Line Items & Tax Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {invoice.items?.length || 0} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Item Description</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-right">Gross</th>
                <th className="px-5 py-3 text-right">Discount</th>
                <th className="px-5 py-3 text-right">Taxable</th>
                <th className="px-5 py-3 text-center">GST Rate</th>
                <th className="px-5 py-3 text-right">Tax Amount</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-4 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{item.itemName}</div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-slate-800">{item.quantity}</td>
                  <td className="px-5 py-4 text-right text-slate-700">
                    ₹{item.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-700">
                    ₹{item.grossAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right text-rose-600">
                    {item.discountAmount > 0
                      ? `-₹${item.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-900">
                    ₹{item.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                      {item.taxRate}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-xs">
                    <div className="font-semibold text-blue-600">
                      ₹{item.taxAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.gstType === 'INTRA_STATE'
                        ? `CGST: ₹${item.cgstAmount} | SGST: ₹${item.sgstAmount}`
                        : `IGST: ₹${item.igstAmount}`}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900">
                    ₹{item.lineTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Breakdown & Financial Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statutory GST Tax Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Statutory GST Tax Breakdown
          </h4>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            {invoice.taxBreakdown?.ratesSummary?.map((rateRow, rIdx) => (
              <div key={rIdx} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{rateRow.taxCode} ({rateRow.rate}%)</span>
                  <span>₹{rateRow.taxAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 mt-1">
                  <span>Taxable Amount</span>
                  <span>₹{rateRow.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {rateRow.cgst > 0 && (
                  <div className="flex justify-between text-blue-700 font-mono mt-0.5">
                    <span>CGST ({rateRow.rate / 2}%)</span>
                    <span>₹{rateRow.cgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {rateRow.sgst > 0 && (
                  <div className="flex justify-between text-blue-700 font-mono mt-0.5">
                    <span>SGST ({rateRow.rate / 2}%)</span>
                    <span>₹{rateRow.sgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {rateRow.igst > 0 && (
                  <div className="flex justify-between text-indigo-700 font-mono mt-0.5">
                    <span>IGST ({rateRow.rate}%)</span>
                    <span>₹{rateRow.igst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-300">
              <span>Total Tax Collected</span>
              <span className="text-blue-700">
                ₹{invoice.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Totals & Balance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-sm">
          <h4 className="font-bold text-slate-900 text-sm">Financial Summary</h4>

          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Gross Subtotal</span>
              <span>₹{invoice.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Total Discounts</span>
              <span>-₹{invoice.discountTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-800">
              <span>Taxable Amount</span>
              <span>₹{invoice.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-blue-700 font-medium">
              <span>Total GST Tax</span>
              <span>+₹{invoice.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-3 border-t border-slate-200">
              <span>Grand Total</span>
              <span>₹{invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium pt-1">
              <span>Amount Paid</span>
              <span>₹{invoice.amountPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 text-base pt-1">
              <span>Outstanding Balance</span>
              <span>₹{invoice.outstandingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail & Notes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" /> Audit History & Operation Log
        </h4>

        {invoice.auditLogs && invoice.auditLogs.length > 0 ? (
          <div className="space-y-3">
            {invoice.auditLogs.map((log, lIdx) => (
              <div
                key={lIdx}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-semibold uppercase text-[10px]">
                  {log.action}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {log.performedBy?.name || 'System'} ({log.performedBy?.role || 'admin'})
                    </span>
                    <span className="text-slate-400">
                      {new Date(log.performedAt).toLocaleString()}
                    </span>
                  </div>
                  {log.reason && <p className="text-slate-600 mt-1 italic">"{log.reason}"</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No previous audit logs recorded.</p>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
              <p className="text-xs text-slate-500">
                Invoice {invoice.invoiceNumber} &bull; Outstanding: ₹{invoice.outstandingAmount}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.outstandingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${invoice.outstandingAmount}`}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="credit_card">Credit Card / Gateway</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant={modalConfig.confirmVariant}
        requiresInput={modalConfig.requiresInput}
        inputLabel={modalConfig.inputLabel}
        inputPlaceholder={modalConfig.inputPlaceholder}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig({ isOpen: false })}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
