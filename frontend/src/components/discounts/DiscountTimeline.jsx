import React from "react";
import { 
  CheckCircle2, 
  Tag, 
  Edit3, 
  AlertCircle, 
  PauseCircle, 
  Archive, 
  Lock, 
  Unlock 
} from "lucide-react";

export const DiscountTimeline = ({ activities = [] }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case "discount_created":
      case "campaign_created":
        return <Tag size={16} color="#2563eb" />;
      case "usage_redeemed":
        return <CheckCircle2 size={16} color="#15803d" />;
      case "usage_reserved":
        return <Lock size={16} color="#7c3aed" />;
      case "usage_released":
        return <Unlock size={16} color="#b45309" />;
      case "discount_updated":
      case "campaign_updated":
        return <Edit3 size={16} color="#475569" />;
      case "discount_status_archived":
      case "campaign_status_archived":
        return <Archive size={16} color="#64748b" />;
      case "usage_limit_reached":
        return <AlertCircle size={16} color="#b91c1c" />;
      default:
        return <Tag size={16} color="#3b82f6" />;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
        No audit activity logged for this discount.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {activities.map((item, idx) => (
        <div
          key={item._id || idx}
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "flex-start",
            position: "relative"
          }}
        >
          {idx < activities.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "28px",
                bottom: "-16px",
                width: "2px",
                backgroundColor: "#e2e8f0"
              }}
            />
          )}

          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              flexShrink: 0
            }}
          >
            {getActionIcon(item.action)}
          </div>

          <div style={{ flex: 1, background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a", textTransform: "capitalize" }}>
                {item.action?.replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155" }}>
              {item.description}
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>
              <span>Role: <strong style={{ textTransform: "capitalize" }}>{item.performedByRole || "System"}</strong></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiscountTimeline;
