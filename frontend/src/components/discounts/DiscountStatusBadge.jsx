import React from "react";

export const DiscountStatusBadge = ({ status }) => {
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
      case "inactive":
        return {
          label: "Inactive",
          style: {
            backgroundColor: "#fef3c7",
            color: "#b45309",
            borderColor: "#fde68a"
          }
        };
      case "expired":
        return {
          label: "Expired",
          style: {
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderColor: "#fca5a5"
          }
        };
      case "archived":
        return {
          label: "Archived",
          style: {
            backgroundColor: "#f1f5f9",
            color: "#475569",
            borderColor: "#cbd5e1"
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

export default DiscountStatusBadge;
