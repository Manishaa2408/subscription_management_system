import React from "react";

export const QuotationStatusBadge = ({ status }) => {
  const configs = {
    draft: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: "Draft" },
    sent: { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd", label: "Sent" },
    accepted: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Accepted" },
    rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Rejected" },
    expired: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Expired" },
    cancelled: { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0", label: "Cancelled" }
  };

  const current = configs[status] || configs.draft;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`
      }}
    >
      {current.label}
    </span>
  );
};

export default QuotationStatusBadge;
