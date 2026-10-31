import React from "react";
import { Printer, X, FileText, CheckCircle, XCircle } from "lucide-react";
import QuotationStatusBadge from "./QuotationStatusBadge";

export const QuotationPreviewModal = ({ quotation, onClose, onAccept, onReject, isCustomer = false }) => {
  if (!quotation) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const isSent = quotation.status === "sent";

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "860px" }}>
        {/* Modal Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#1e40af" }}>
            <FileText size={20} />
            <span>Commercial Proposal Preview</span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
              <Printer size={15} /> Print / PDF
            </button>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              <X size={15} /> Close
            </button>
          </div>
        </div>

        {/* Printable Proposal Document */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "36px",
            background: "#ffffff"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #1e40af", paddingBottom: "20px", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e40af" }}>
                Brightloop Software
              </h1>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                Cloud Subscription & ERP SaaS Solutions
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                billing@brightloop.io • +91 484 2900000
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                {quotation.quotationNumber}
              </div>
              <div style={{ margin: "6px 0" }}>
                <QuotationStatusBadge status={quotation.status} />
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Date: <strong>{new Date(quotation.quotationDate).toLocaleDateString()}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#dc2626", marginTop: "2px" }}>
                Valid Until: <strong>{new Date(quotation.validUntil).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Customer Details Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px", marginBottom: "24px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
              Prepared For
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
              {quotation.customerSnapshot?.name}
            </div>
            {quotation.customerSnapshot?.companyName && (
              <div style={{ fontSize: "0.9rem", color: "#475569" }}>
                {quotation.customerSnapshot.companyName}
              </div>
            )}
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
              Email: {quotation.customerSnapshot?.email} | Phone: {quotation.customerSnapshot?.phone || "N/A"}
            </div>
            {quotation.customerSnapshot?.billingAddress && (
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Address: {quotation.customerSnapshot.billingAddress.street}, {quotation.customerSnapshot.billingAddress.city}, {quotation.customerSnapshot.billingAddress.state} - {quotation.customerSnapshot.billingAddress.postalCode}
              </div>
            )}
          </div>

          {/* Line items table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                <th style={{ textAlign: "left", padding: "10px" }}>Item & Description</th>
                <th style={{ textAlign: "center", padding: "10px", width: "110px" }}>Billing</th>
                <th style={{ textAlign: "right", padding: "10px", width: "60px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px", width: "100px" }}>Unit Price</th>
                <th style={{ textAlign: "right", padding: "10px", width: "80px" }}>Tax</th>
                <th style={{ textAlign: "right", padding: "10px", width: "110px" }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lineItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {item.description || item.productSnapshot?.name || item.planSnapshot?.name || "Product/Service"}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", textTransform: "capitalize", color: "#64748b" }}>
                    {item.billingFrequency?.replace("_", " ")}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "10px" }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", padding: "10px" }}>{item.taxRate}%</td>
                  <td style={{ textAlign: "right", padding: "10px", fontWeight: 600, color: "#1e40af" }}>
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            <div style={{ width: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.subtotal)}</span>
              </div>

              {quotation.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem", color: "#16a34a" }}>
                  <span>Discount ({quotation.discountDetails?.code || "Voucher"}):</span>
                  <span style={{ fontWeight: 600 }}>-{formatCurrency(quotation.discountAmount)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.9rem" }}>
                <span>Taxable Amount:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.taxableAmount)}</span>
              </div>

              {quotation.taxBreakdown?.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "0.8rem", color: "#64748b" }}>
                  <span>{t.name} ({t.rate}%):</span>
                  <span>{formatCurrency(t.amount)}</span>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0 4px",
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

          {/* Terms & Conditions */}
          {quotation.termsAndConditions && (
            <div style={{ fontSize: "0.8rem", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "16px", whiteSpace: "pre-line" }}>
              <strong>Terms & Conditions:</strong><br />
              {quotation.termsAndConditions}
            </div>
          )}

          {/* Customer Acceptance Controls */}
          {isCustomer && isSent && (
            <div className="no-print" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "2px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                By accepting, you agree to commence billing according to the terms above.
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-outline btn-sm" style={{ color: "#dc2626", borderColor: "#fca5a5" }} onClick={onReject}>
                  <XCircle size={15} /> Reject Quotation
                </button>
                <button className="btn btn-primary btn-sm" style={{ background: "#16a34a" }} onClick={onAccept}>
                  <CheckCircle size={15} /> Accept Quotation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationPreviewModal;
