import React from "react";
import { Printer, X, ShieldCheck, FileText } from "lucide-react";
import TemplateStatusBadge from "./TemplateStatusBadge";

export const TemplatePreview = ({ template, onClose }) => {
  if (!template) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Actions bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1e40af", fontWeight: 700 }}>
            <FileText size={20} />
            <span>Quotation Template Preview</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print / Export PDF
            </button>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              <X size={15} /> Close
            </button>
          </div>
        </div>

        {/* Printable Quotation Template Sheet */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "36px",
            background: "#ffffff"
          }}
        >
          {/* Header & Branding */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e40af", paddingBottom: "20px", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em" }}>
                Brightloop Software
              </h1>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                Cloud Subscription & ERP Solutions • brightloop.io
              </div>
              <div style={{ marginTop: "12px", display: "inline-block", background: "#f8fafc", padding: "4px 10px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#475569" }}>
                <strong>NOTICE:</strong> Reusable Quotation Template (Draft Configuration)
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                {template.code || "QT-DRAFT"}
              </div>
              <div style={{ marginTop: "6px" }}>
                <TemplateStatusBadge status={template.status || "active"} />
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "8px" }}>
                Default Validity: <strong>{template.validityDays} Days</strong>
              </div>
            </div>
          </div>

          {/* Template Details */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              {template.name}
            </h2>
            {template.description && (
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "8px" }}>
                {template.description}
              </p>
            )}
            {template.notes && (
              <div style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                Notes: {template.notes}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Item / Description</th>
                <th style={{ textAlign: "center", padding: "10px 12px", width: "90px" }}>Type</th>
                <th style={{ textAlign: "right", padding: "10px 12px", width: "70px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px 12px", width: "110px" }}>Unit Price</th>
                <th style={{ textAlign: "right", padding: "10px 12px", width: "80px" }}>Tax Rate</th>
                <th style={{ textAlign: "right", padding: "10px 12px", width: "120px" }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(template.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.itemName}</div>
                    {item.description && (
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.description}</div>
                    )}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px" }}>
                    <span className={`badge ${item.itemType === "plan" ? "badge-plan" : "badge-product"}`}>
                      {item.itemType}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", padding: "12px" }}>{item.taxRate}%</td>
                  <td style={{ textAlign: "right", padding: "12px", fontWeight: 600, color: "#1e40af" }}>
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Calculation */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "280px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", color: "#475569" }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(template.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", color: "#475569" }}>
                <span>Tax Total:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(template.taxTotal)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0 6px",
                  borderTop: "2px solid #0f172a",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#1e40af"
                }}
              >
                <span>Grand Total:</span>
                <span>{formatCurrency(template.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
