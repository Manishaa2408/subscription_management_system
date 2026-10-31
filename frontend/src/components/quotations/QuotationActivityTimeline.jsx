import React from "react";
import { Clock, CheckCircle2, XCircle, Send, PlusCircle, AlertCircle, RefreshCw } from "lucide-react";

export const QuotationActivityTimeline = ({ activities = [] }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case "created":
        return <PlusCircle size={16} color="#2563eb" />;
      case "sent":
        return <Send size={16} color="#0284c7" />;
      case "accepted":
        return <CheckCircle2 size={16} color="#16a34a" />;
      case "rejected":
        return <XCircle size={16} color="#dc2626" />;
      case "expired":
        return <Clock size={16} color="#d97706" />;
      case "cancelled":
        return <AlertCircle size={16} color="#94a3b8" />;
      case "conversion_completed":
        return <CheckCircle2 size={16} color="#7c3aed" />;
      default:
        return <RefreshCw size={16} color="#64748b" />;
    }
  };

  if (!activities || activities.length === 0) {
    return <div style={{ fontSize: "0.85rem", color: "#64748b", padding: "12px 0" }}>No audit activity recorded yet.</div>;
  }

  return (
    <div style={{ position: "relative", paddingLeft: "24px" }}>
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: "8px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          background: "#e2e8f0"
        }}
      />

      {activities.map((act, index) => (
        <div key={act._id || index} style={{ position: "relative", marginBottom: "18px" }}>
          {/* Node icon */}
          <div
            style={{
              position: "absolute",
              left: "-24px",
              top: "2px",
              background: "#fff",
              borderRadius: "50%",
              padding: "2px"
            }}
          >
            {getActionIcon(act.action)}
          </div>

          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
            {act.description}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
            <span style={{ textTransform: "uppercase", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px" }}>
              {act.performedByRole}
            </span>
            <span>•</span>
            <span>{new Date(act.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuotationActivityTimeline;
