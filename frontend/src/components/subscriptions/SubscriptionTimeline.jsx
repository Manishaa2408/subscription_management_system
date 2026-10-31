import React from "react";
import { 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  AlertCircle 
} from "lucide-react";

export const SubscriptionTimeline = ({ activities = [] }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case "activated":
        return <CheckCircle2 size={16} color="#15803d" />;
      case "paused":
        return <PauseCircle size={16} color="#b45309" />;
      case "resumed":
        return <PlayCircle size={16} color="#2563eb" />;
      case "renewed":
        return <RefreshCw size={16} color="#059669" />;
      case "plan_upgraded":
      case "plan_changed":
        return <TrendingUp size={16} color="#7c3aed" />;
      case "cancelled":
        return <XCircle size={16} color="#b91c1c" />;
      case "expired":
        return <Clock size={16} color="#64748b" />;
      default:
        return <AlertCircle size={16} color="#3b82f6" />;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
        No lifecycle activity recorded yet.
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
          {/* Vertical line connector */}
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

          {/* Icon bubble */}
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

          {/* Details */}
          <div style={{ flex: 1, background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a", textTransform: "capitalize" }}>
                {item.action?.replace("_", " ")}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {new Date(item.performedAt || item.createdAt).toLocaleString()}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155" }}>
              {item.description}
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>
              <span>Role: <strong style={{ textTransform: "capitalize" }}>{item.performedByRole || "System"}</strong></span>
              {item.newStatus && <span>Status: <strong>{item.newStatus}</strong></span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionTimeline;
