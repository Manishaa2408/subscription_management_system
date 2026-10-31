import React from "react";
import { RefreshCw, CheckCircle, Clock } from "lucide-react";

export const SubscriptionRenewalHistory = ({ renewals = [] }) => {
  if (!renewals || renewals.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
        <RefreshCw size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>No renewal cycles executed yet.</p>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Renewals advance billing dates and are recorded idempotently.
        </span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="items-table" style={{ width: "100%", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th>Cycle #</th>
            <th>Billing Period Start</th>
            <th>Billing Period End</th>
            <th>Next Billing Date</th>
            <th>Status</th>
            <th>Idempotency Reference</th>
            <th>Recorded At</th>
          </tr>
        </thead>
        <tbody>
          {renewals.map((r) => (
            <tr key={r._id}>
              <td>
                <strong style={{ color: "#2563eb" }}>Cycle #{r.renewalNumber}</strong>
              </td>
              <td>{new Date(r.periodStart).toLocaleDateString()}</td>
              <td>{new Date(r.periodEnd).toLocaleDateString()}</td>
              <td style={{ fontWeight: 600 }}>{new Date(r.nextBillingDate).toLocaleDateString()}</td>
              <td>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    backgroundColor: r.status === "active" ? "#dcfce7" : "#f1f5f9",
                    color: r.status === "active" ? "#15803d" : "#475569"
                  }}
                >
                  {r.status}
                </span>
              </td>
              <td>
                <code style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                  {r.idempotencyKey}
                </code>
              </td>
              <td style={{ color: "#64748b" }}>
                {new Date(r.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionRenewalHistory;
