import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import QuotationStatusBadge from "../../components/quotations/QuotationStatusBadge";
import QuotationActivityTimeline from "../../components/quotations/QuotationActivityTimeline";
import QuotationPreviewModal from "../../components/quotations/QuotationPreviewModal";
import {
  ArrowLeft, Edit2, Send, FileText, ArrowUpRight, XCircle, Printer,
  CheckCircle, Clock, AlertTriangle, ShieldCheck
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
    if (!window.confirm(`Convert accepted quotation ${quotation.quotationNumber} to a Subscription (M7)?`)) return;
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
    return <div className="card" style={{ textAlign: "center", padding: "48px" }}>Loading quotation details...</div>;
  }

  if (error || !quotation) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <h2 style={{ color: "#ef4444", marginBottom: "8px" }}>Error Loading Quotation</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>{error || "Quotation not found"}</p>
        <Link to="/quotations" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Quotations
        </Link>
      </div>
    );
  }

  const isDraft = quotation.status === "draft";
  const isSent = quotation.status === "sent";
  const isAccepted = quotation.status === "accepted";

  return (
    <div>
      {/* Top Header & Action Controls */}
      <div className="page-header">
        <div>
          <Link to="/quotations" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", marginBottom: "8px" }}>
            <ArrowLeft size={14} /> Back to Quotations
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 className="page-title">{quotation.quotationNumber}</h1>
            <QuotationStatusBadge status={quotation.status} />
          </div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}>
            Prepared for: <strong style={{ color: "#0f172a" }}>{quotation.customerSnapshot?.name}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={() => setShowPreview(true)}>
            <FileText size={16} /> Proposal Preview
          </button>

          <a href={`/api/quotations/${quotation._id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <Printer size={16} /> PDF Print View
          </a>

          {/* Draft Actions */}
          {!isCustomer && isDraft && (
            <>
              <Link to={`/quotations/${quotation._id}/edit`} className="btn btn-outline">
                <Edit2 size={16} /> Edit Draft
              </Link>
              <button className="btn btn-primary" onClick={handleSend}>
                <Send size={16} /> Finalize & Send
              </button>
            </>
          )}

          {/* Customer Accept / Reject Actions */}
          {isCustomer && isSent && (
            <>
              <button className="btn btn-outline" style={{ color: "#dc2626", borderColor: "#fca5a5" }} onClick={handleReject}>
                <XCircle size={16} /> Decline
              </button>
              <button className="btn btn-primary" style={{ background: "#16a34a" }} onClick={handleAccept}>
                <CheckCircle size={16} /> Accept Quotation
              </button>
            </>
          )}

          {/* Accepted Conversion to Subscription */}
          {!isCustomer && isAccepted && (
            <button
              className="btn btn-primary"
              style={{ background: "#7c3aed" }}
              onClick={handleConvert}
              disabled={quotation.subscriptionConversion?.status === "converted"}
            >
              <ArrowUpRight size={16} /> {quotation.subscriptionConversion?.status === "converted" ? "Converted to Subscription" : "Convert to Subscription"}
            </button>
          )}

          {/* Cancel Quotation */}
          {!isCustomer && ["draft", "sent"].includes(quotation.status) && (
            <button className="btn btn-danger" onClick={handleCancel}>
              <XCircle size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Subscription Conversion Banner (if converted) */}
      {quotation.subscriptionConversion?.status === "converted" && (
        <div className="alert alert-success" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldCheck size={20} />
          <div>
            <strong>Subscription Activated:</strong> Subscription ID <code>{quotation.subscriptionConversion.subscriptionId}</code> was created from this quotation on {new Date(quotation.subscriptionConversion.convertedAt).toLocaleString()}.
          </div>
        </div>
      )}

      {/* Top 3 Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>Customer Details</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
            {quotation.customerSnapshot?.name}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
            {quotation.customerSnapshot?.email} | {quotation.customerSnapshot?.phone || "N/A"}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>Quotation Validity</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: quotation.status === "expired" ? "#dc2626" : "#0f172a", marginTop: "4px" }}>
            Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
            Created: {new Date(quotation.quotationDate).toLocaleDateString()}
          </div>
        </div>

        <div className="card" style={{ margin: 0, background: "#f8fafc" }}>
          <div style={{ fontSize: "0.8rem", color: "#1e40af", textTransform: "uppercase", fontWeight: 700 }}>Proposal Grand Total</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e40af", marginTop: "4px" }}>
            {formatCurrency(quotation.grandTotal)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
            Subtotal: {formatCurrency(quotation.subtotal)} | Taxes: {formatCurrency(quotation.totalTax)}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
          Configured Software & Services
        </h2>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item & Description</th>
                <th style={{ width: "120px", textAlign: "center" }}>Billing</th>
                <th style={{ width: "70px", textAlign: "right" }}>Qty</th>
                <th style={{ width: "110px", textAlign: "right" }}>Unit Price</th>
                <th style={{ width: "80px", textAlign: "right" }}>Tax</th>
                <th style={{ width: "130px", textAlign: "right" }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lineItems?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                  </td>
                  <td style={{ textAlign: "center", textTransform: "capitalize", color: "#64748b" }}>
                    {item.billingFrequency?.replace("_", " ")}
                  </td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: "right" }}>{item.taxRate}%</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "#1e40af" }}>
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <div style={{ width: "320px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem" }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.subtotal)}</span>
            </div>

            {quotation.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem", color: "#16a34a" }}>
                <span>Discount ({quotation.discountDetails?.code || "Coupon"}):</span>
                <span style={{ fontWeight: 600 }}>-{formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem" }}>
              <span>Taxable Amount:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.taxableAmount)}</span>
            </div>

            {quotation.taxBreakdown?.map((t, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "0.8rem", color: "#64748b" }}>
                <span>{t.name} ({t.rate}%):</span>
                <span>{formatCurrency(t.amount)}</span>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0 2px",
                borderTop: "2px solid #0f172a",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#1e40af"
              }}
            >
              <span>Grand Total:</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer / Internal Notes */}
      {(quotation.customerNotes || quotation.internalNotes) && (
        <div className="card">
          {quotation.customerNotes && (
            <div style={{ marginBottom: quotation.internalNotes ? "16px" : 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Customer Notes
              </div>
              <p style={{ color: "#1e293b", fontSize: "0.9rem" }}>{quotation.customerNotes}</p>
            </div>
          )}
          {!isCustomer && quotation.internalNotes && (
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#b45309", marginBottom: "4px" }}>
                Internal Sales Notes (Invisible to Customer)
              </div>
              <p style={{ color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>{quotation.internalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline Card */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
          Audit Trail & Activity Log
        </h2>
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
