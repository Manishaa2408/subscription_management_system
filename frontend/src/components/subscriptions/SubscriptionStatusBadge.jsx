import React from "react";

export const SubscriptionStatusBadge = ({ status }) => {
  const getBadgeConfig = (st) => {
    switch (st?.toLowerCase()) {
      case "active":
        return {
          label: "Active",
          style: {
            backgroundColor: "#dcfce7",
            color: "#15803d",
            borderColor: "#86efac"
          }
        };
      case "trial":
        return {
          label: "Trial Period",
          style: {
            backgroundColor: "#e0e7ff",
            color: "#4338ca",
            borderColor: "#c7d2fe"
          }
        };
      case "paused":
        return {
          label: "Paused",
          style: {
            backgroundColor: "#fef3c7",
            color: "#b45309",
            borderColor: "#fde68a"
          }
        };
      case "pending":
        return {
          label: "Pending",
          style: {
            backgroundColor: "#f1f5f9",
            color: "#475569",
            borderColor: "#cbd5e1"
          }
        };
      case "past_due":
        return {
          label: "Past Due",
          style: {
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderColor: "#fca5a5"
          }
        };
      case "cancelled":
        return {
          label: "Cancelled",
          style: {
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
            borderColor: "#d1d5db"
          }
        };
      case "expired":
        return {
          label: "Expired",
          style: {
            backgroundColor: "#f8fafc",
            color: "#94a3b8",
            borderColor: "#e2e8f0"
          }
        };
      default:
        return {
          label: st || "Unknown",
          style: {
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
            borderColor: "#e5e7eb"
          }
        };
    }
  };

  const { label, style } = getBadgeConfig(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        border: "1px solid",
        ...style
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: style.color
        }}
      />
      {label}
    </span>
  );
};

export default SubscriptionStatusBadge;
