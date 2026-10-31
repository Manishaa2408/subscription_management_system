import React from "react";
import { CheckCircle2, Lock, Unlock, Clock } from "lucide-react";

export const DiscountUsageHistory = ({ usages = [] }) => {
  if (!usages || usages.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
        <CheckCircle2 size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>No redemption or reservation records yet.</p>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Usage records are logged when customers apply and redeem this coupon.
        </span>
      </div>
    );
  }

  const getStatusBadge = (st) => {
    switch (st) {
      case "redeemed":
        return { label: "Redeemed", bg: "#dcfce7", color: "#15803d" };
      case "reserved":
        return { label: "Reserved", bg: "#f3e8ff", color: "#7c3aed" };
      case "released":
        return { label: "Released", bg: "#fef3c7", color: "#b45309" };
      case "expired":
        return { label: "Expired", bg: "#fee2e2", color: "#b91c1c" };
      default:
        return { label: st, bg: "#f1f5f9", color: "#475569" };
    }
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="items-table" style={{ width: "100%", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Customer ID</th>
            <th>Discount Value</th>
            <th>Context Type</th>
            <th>Idempotency Reference</th>
            <th>Redeemed Date</th>
          </tr>
        </thead>
        <tbody>
          {usages.map((u) => {
            const st = getStatusBadge(u.status);
            return (
              <tr key={u._id}>
                <td>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      backgroundColor: st.bg,
                      color: st.color
                    }}
                  >
                    {st.label}
                  </span>
                </td>
                <td>
                  <code>{u.customerId}</code>
                </td>
                <td>
                  <strong style={{ color: "#15803d" }}>
                    ₹{(u.discountAmount || 0).toLocaleString()}
                  </strong>
                </td>
                <td>
                  <span style={{ textTransform: "capitalize", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>
                    {u.contextType || "quotation"}
                  </span>
                </td>
                <td>
                  <code style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {u.idempotencyKey}
                  </code>
                </td>
                <td style={{ color: "#64748b" }}>
                  {u.redeemedAt
                    ? new Date(u.redeemedAt).toLocaleString()
                    : u.reservedAt
                    ? `Reserved: ${new Date(u.reservedAt).toLocaleDateString()}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DiscountUsageHistory;
