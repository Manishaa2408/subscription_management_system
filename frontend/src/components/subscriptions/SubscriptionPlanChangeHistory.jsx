import React from "react";
import { TrendingUp, TrendingDown, ArrowRight, Layers } from "lucide-react";

export const SubscriptionPlanChangeHistory = ({ planChanges = [] }) => {
  if (!planChanges || planChanges.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
        <Layers size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>No plan upgrades or downgrades on record.</p>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          All plan modifications with price differentials are logged here.
        </span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="items-table" style={{ width: "100%", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th>Change Type</th>
            <th>Previous Plan</th>
            <th></th>
            <th>New Plan</th>
            <th>Price Adjustment</th>
            <th>Reason</th>
            <th>Effective Date</th>
            <th>Changed By</th>
          </tr>
        </thead>
        <tbody>
          {planChanges.map((pc) => {
            const isUpgrade = pc.changeType === "upgrade";
            return (
              <tr key={pc._id}>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      backgroundColor: isUpgrade ? "#dcfce7" : "#fef3c7",
                      color: isUpgrade ? "#15803d" : "#b45309",
                      border: "1px solid currentColor"
                    }}
                  >
                    {isUpgrade ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {pc.changeType}
                  </span>
                </td>
                <td>
                  <strong>{pc.previousPlanSnapshot?.name || "Previous Plan"}</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ₹{pc.previousPlanSnapshot?.price?.toLocaleString()} / {pc.previousPlanSnapshot?.billingFrequency || "mo"}
                  </div>
                </td>
                <td style={{ textAlign: "center", color: "#94a3b8" }}>
                  <ArrowRight size={16} />
                </td>
                <td>
                  <strong style={{ color: "#2563eb" }}>{pc.newPlanSnapshot?.name || "New Plan"}</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ₹{pc.newPlanSnapshot?.price?.toLocaleString()} / {pc.newPlanSnapshot?.billingFrequency || "mo"}
                  </div>
                </td>
                <td>
                  <strong style={{ color: isUpgrade ? "#15803d" : "#b45309" }}>
                    {isUpgrade ? "+" : "-"} ₹{Math.abs(pc.priceDifference || 0).toLocaleString()}
                  </strong>
                </td>
                <td style={{ color: "#334155" }}>
                  {pc.reason || "N/A"}
                </td>
                <td style={{ color: "#64748b" }}>
                  {new Date(pc.effectiveDate || pc.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <span style={{ textTransform: "capitalize", fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    {pc.requestedByRole || "Staff"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionPlanChangeHistory;
