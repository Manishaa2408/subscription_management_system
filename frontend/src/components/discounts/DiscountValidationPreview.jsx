import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import discountService from "../../services/discountService";

export const DiscountValidationPreview = ({ initialCode = "", customers = [], plans = [] }) => {
  const [code, setCode] = useState(initialCode);
  const [customerId, setCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [subtotal, setSubtotal] = useState("2000");
  const [currency, setCurrency] = useState("INR");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setResult(null);

      // Build context
      const context = {
        code: code.trim(),
        customerId: customerId || undefined,
        subtotal: Number(subtotal) || 0,
        currency,
        lineItems: selectedPlanId ? [
          {
            planId: selectedPlanId,
            quantity: 1,
            unitPrice: Number(subtotal) || 0
          }
        ] : []
      };

      const res = await discountService.validateDiscount(context);
      setResult({
        valid: res.success,
        message: res.message,
        reasonCode: res.reasonCode,
        data: res.data
      });
    } catch (err) {
      setResult({
        valid: false,
        message: err.response?.data?.message || err.message || "Validation failed",
        reasonCode: err.response?.data?.reasonCode || "ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Sparkles size={18} color="#2563eb" />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>
          Discount Validation & Calculation Tester (Preview Only)
        </h3>
      </div>
      <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0" }}>
        Simulate an order context to test discount rules, caps, customer eligibility, and plan applicability in real-time. This testing tool never consumes or redeems usage.
      </p>

      <form onSubmit={handleTest}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Discount Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. WELCOME20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Order Amount (₹) *</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Simulated Customer</label>
            <select
              className="form-control"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">-- Any Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Target Plan (Optional)</label>
            <select
              className="form-control"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">-- Any Plan --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 16px" }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {loading ? "Evaluating..." : "Test Validation"}
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div
          style={{
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${result.valid ? "#86efac" : "#fca5a5"}`,
            background: result.valid ? "#f0fdf4" : "#fef2f2"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            {result.valid ? (
              <CheckCircle2 size={18} color="#15803d" />
            ) : (
              <AlertTriangle size={18} color="#b91c1c" />
            )}
            <strong style={{ color: result.valid ? "#15803d" : "#b91c1c", fontSize: "0.95rem" }}>
              {result.valid ? "Valid & Eligible" : "Validation Failed"}
            </strong>
          </div>

          <p style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: result.valid ? "#166534" : "#991b1b" }}>
            {result.message}
            {result.reasonCode && (
              <code style={{ marginLeft: "8px", fontSize: "0.75rem", background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                {result.reasonCode}
              </code>
            )}
          </p>

          {result.valid && result.data && (
            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #dcfce7", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", fontSize: "0.8rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Eligible Order Amount</span>
                <strong>₹{result.data.eligibleAmount?.toLocaleString()}</strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block" }}>Discount Rule</span>
                <strong>
                  {result.data.discountType === "percentage"
                    ? `${result.data.discountValue}% Off`
                    : `Flat ₹${result.data.discountValue}`}
                </strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block" }}>Final Discount</span>
                <strong style={{ color: "#15803d", fontSize: "1rem" }}>
                  - ₹{result.data.discountAmount?.toLocaleString()}
                </strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block" }}>Application Type</span>
                <span style={{ textTransform: "capitalize" }}>
                  {result.data.applicationType === "recurring"
                    ? `Recurring (${result.data.billingCycles} Cycles)`
                    : "One-Time"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountValidationPreview;
