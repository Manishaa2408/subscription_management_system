import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import QuotationStatusBadge from "../../components/quotations/QuotationStatusBadge";
import QuotationActivityTimeline from "../../components/quotations/QuotationActivityTimeline";
import QuotationPreviewModal from "../../components/quotations/QuotationPreviewModal";
import { LoadingState } from "../../components/common/LoadingState";
import {
  ArrowLeft, Edit2, Send, FileText, ArrowUpRight, XCircle, Printer,
  CheckCircle, Clock, AlertTriangle, ShieldCheck, User, Calendar, IndianRupee
} from "lucide-react";

export const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, isCustomer } = useAuth();

  const [quotation, setQuotation] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchQuotationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, act] = await Promise.all([
        quotationService.getQuotationById(id),
        quotationService.getQuotationActivity(id)
      ]);
      setQuotation(res.data.quotation);
      setActivity(act || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load quotation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationData();
  }, [id, role]);

  const handleSend = async () => {
    if (!window.confirm(`Officially finalize and send ${quotation.quotationNumber} to ${quotation.customerSnapshot.name}?`)) return;
    try {
      await quotationService.sendQuotation(id);
      fetchQuotationData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send quotation");
    }
  };

  const handleAccept = async () => {
    if (!window.confirm(`Accept commercial quotation ${quotation.quotationNumber}?`)) return;
    try {
      await quotationService.acceptQuotation(id);
      fetchQuotationData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept quotation");
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Please state the reason for rejecting this quotation:");
    if (reason === null) return;
    try {
      await quotationService.rejectQuotation(id, reason);
      fetchQuotationData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject quotation");
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Enter cancellation reason:");
    if (reason === null) return;
    try {
      await quotationService.cancelQuotation(id, reason);
      fetchQuotationData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel quotation");
    }
  };

  const handleConvert = async () => {
    if (!window.confirm(`Convert accepted quotation ${quotation.quotationNumber} into an active subscription?`)) return;
    try {
      const res = await quotationService.convertQuotation(id);
      alert(`Success! Subscription created: ${res.data.subscriptionId}`);
      fetchQuotationData();
    } catch (err) {
      alert(err.response?.data?.message || "Conversion failed");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  if (loading) {
    return <LoadingState message="Loading quotation details..." />;
  }

  if (error || !quotation) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Error Loading Quotation</h2>
        <p className="text-sm text-slate-500 mb-4">{error || "Quotation not found"}</p>
        <Link
          to="/quotations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
      </div>
    );
  }

  const isDraft = quotation.status === "draft";
  const isSent = quotation.status === "sent";
  const isAccepted = quotation.status === "accepted";

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/quotations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-slate-900">{quotation.quotationNumber}</h1>
            <QuotationStatusBadge status={quotation.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Prepared for <strong className="text-slate-800">{quotation.customerSnapshot?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-400" /> Proposal Preview
          </button>

          <a
            href={`/api/quotations/${quotation._id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-400" /> PDF View
          </a>

          {!isCustomer && isDraft && (
            <>
              <Link
                to={`/quotations/${quotation._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Edit2 className="w-4 h-4 text-slate-400" /> Edit Draft
              </Link>
              <button
                onClick={handleSend}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Send className="w-4 h-4" /> Finalize & Send
              </button>
            </>
          )}

          {isCustomer && isSent && (
            <>
              <button
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold rounded-xl transition"
              >
                <XCircle className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={handleAccept}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <CheckCircle className="w-4 h-4" /> Accept Quotation
              </button>
            </>
          )}

          {!isCustomer && isAccepted && (
            <button
              onClick={handleConvert}
              disabled={quotation.subscriptionConversion?.status === "converted"}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition shadow-xs ${
                quotation.subscriptionConversion?.status === "converted"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {quotation.subscriptionConversion?.status === "converted" ? "Converted to Subscription" : "Convert to Subscription"}
            </button>
          )}

          {!isCustomer && ["draft", "sent"].includes(quotation.status) && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Subscription Conversion Banner */}
      {quotation.subscriptionConversion?.status === "converted" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Subscription Activated:</span> Subscription ID{" "}
            <code className="font-mono bg-emerald-100/70 px-1.5 py-0.5 rounded text-xs font-bold text-emerald-900">
              {quotation.subscriptionConversion.subscriptionId}
            </code>{" "}
            was created from this proposal on {new Date(quotation.subscriptionConversion.convertedAt).toLocaleString()}.
          </div>
        </div>
      )}

      {/* Top 3 Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <User className="w-3.5 h-3.5" /> Customer Details
          </div>
          <div className="text-base font-bold text-slate-900 mt-2">
            {quotation.customerSnapshot?.name}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {quotation.customerSnapshot?.email} {quotation.customerSnapshot?.phone ? `• ${quotation.customerSnapshot.phone}` : ""}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="w-3.5 h-3.5" /> Proposal Timeline
          </div>
          <div className={`text-base font-bold mt-2 ${quotation.status === "expired" ? "text-rose-600" : "text-slate-900"}`}>
            Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Created: {new Date(quotation.quotationDate).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <IndianRupee className="w-3.5 h-3.5" /> Grand Total
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {formatCurrency(quotation.grandTotal)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Subtotal: {formatCurrency(quotation.subtotal)} • Tax: {formatCurrency(quotation.totalTax)}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900">Configured Software & Services</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item & Description</th>
                <th className="px-4 py-3 text-center">Billing</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.lineItems?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {item.description}
                  </td>
                  <td className="px-4 py-3.5 text-center capitalize text-slate-500 text-xs">
                    {item.billingFrequency?.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-700">{item.quantity}</td>
                  <td className="px-4 py-3.5 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500 text-xs">{item.taxRate}%</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(quotation.subtotal)}</span>
            </div>

            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({quotation.discountDetails?.code || "Coupon"}):</span>
                <span>-{formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(quotation.taxableAmount)}</span>
            </div>

            {quotation.taxBreakdown?.map((t, idx) => (
              <div key={idx} className="flex justify-between text-slate-500">
                <span>{t.name} ({t.rate}%):</span>
                <span>{formatCurrency(t.amount)}</span>
              </div>
            ))}

            <div className="flex justify-between text-base font-bold text-blue-700 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Internal Notes */}
      {(quotation.customerNotes || quotation.internalNotes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotation.customerNotes && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Customer Notes
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.customerNotes}</p>
            </div>
          )}

          {!isCustomer && quotation.internalNotes && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-2">
                Internal Sales Notes
              </span>
              <p className="text-sm text-slate-600 italic whitespace-pre-wrap">{quotation.internalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail & Activity Log */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Audit Trail & Activity Log</h2>
        <QuotationActivityTimeline activities={activity} />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <QuotationPreviewModal
          quotation={quotation}
          onClose={() => setShowPreview(false)}
          onAccept={handleAccept}
          onReject={handleReject}
          isCustomer={isCustomer}
        />
      )}
    </div>
  );
};

export default QuotationDetails;
