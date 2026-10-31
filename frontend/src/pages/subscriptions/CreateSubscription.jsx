import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  FileCheck, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Trash2,
  Calendar,
  Sparkles
} from "lucide-react";
import subscriptionService from "../../services/subscriptionService";

export const CreateSubscription = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("quotation"); // "quotation" or "manual"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Catalog state
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState([]);

  // Tab 1 state: Quotation conversion
  const [selectedQuotationId, setSelectedQuotationId] = useState("");

  // Tab 2 state: Manual creation
  const [customerId, setCustomerId] = useState("");
  const [trialEnabled, setTrialEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [billingFrequency, setBillingFrequency] = useState("monthly");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await subscriptionService.getCatalogData();
        setCustomers(res.data?.customers || []);
        setPlans(res.data?.plans || []);
        setAcceptedQuotations(res.data?.acceptedQuotations || []);

        if (res.data?.acceptedQuotations?.length > 0) {
          setSelectedQuotationId(res.data.acceptedQuotations[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load catalog data.");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Handle Tab 1 Conversion
  const handleConvertQuotation = async (e) => {
    e.preventDefault();
    if (!selectedQuotationId) {
      setError("Please select an accepted quotation to convert.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await subscriptionService.createFromQuotation(selectedQuotationId);
      const sub = res.data?.subscription;
      setSuccess(`Subscription ${sub.subscriptionNumber} created successfully! Redirecting...`);
      setTimeout(() => {
        navigate(`/subscriptions/${sub._id}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Conversion failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Tab 2 Manual Creation
  const handleManualCreate = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (!selectedPlanId) {
      setError("Please select a subscription plan.");
      return;
    }

    const chosenPlan = plans.find((p) => p._id === selectedPlanId);
    const unitPrice = chosenPlan ? (chosenPlan.price || chosenPlan.pricing?.monthly || 0) : 0;

    const payload = {
      customerId,
      startDate: new Date(startDate),
      trialEnabled,
      trialDays: trialEnabled ? Number(trialDays) : 0,
      lineItems: [
        {
          planId: chosenPlan._id,
          planSnapshot: {
            name: chosenPlan.name,
            price: unitPrice,
            billingFrequency: billingFrequency
          },
          description: chosenPlan.description || chosenPlan.name,
          quantity: Number(quantity) || 1,
          unitPrice,
          billingFrequency: billingFrequency,
          billingInterval: 1
        }
      ]
    };

    try {
      setSubmitting(true);
      setError(null);
      const res = await subscriptionService.createManualSubscription(payload);
      const sub = res.data?.subscription;
      setSuccess(`Subscription ${sub.subscriptionNumber} created successfully! Redirecting...`);
      setTimeout(() => {
        navigate(`/subscriptions/${sub._id}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedQuotation = acceptedQuotations.find((q) => q._id === selectedQuotationId);
  const chosenPlanObj = plans.find((p) => p._id === selectedPlanId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/subscriptions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscriptions
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          New Subscription
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Convert an accepted commercial proposal or configure a new standalone subscription contract.
        </p>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("quotation")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "quotation" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "quotation" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.95rem"
          }}
        >
          <FileCheck size={18} /> Convert from Accepted Quotation
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "manual" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "manual" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.95rem"
          }}
        >
          <Layers size={18} /> Manual Subscription Creation
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading catalog and accepted quotations...</p>
        </div>
      ) : activeTab === "quotation" ? (
        /* TAB 1: CONVERT QUOTATION */
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Sparkles size={18} color="#2563eb" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: 0 }}>
              Convert Accepted Quotation to Active Subscription
            </h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "20px" }}>
            Select any proposal that has been formally accepted by the customer. The system will automatically generate a unique subscription number, snapshot commercial rates, and register the recurring billing schedule.
          </p>

          {acceptedQuotations.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <AlertCircle size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No unconverted accepted quotations found.</p>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Accept a quotation in Quotations first or use Manual Creation.
              </span>
            </div>
          ) : (
            <form onSubmit={handleConvertQuotation}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">Select Accepted Quotation *</label>
                <select
                  className="form-control"
                  value={selectedQuotationId}
                  onChange={(e) => setSelectedQuotationId(e.target.value)}
                  required
                >
                  {acceptedQuotations.map((q) => (
                    <option key={q._id} value={q._id}>
                      {q.quotationNumber} — {q.customerSnapshot?.name || "Customer"} (₹{q.grandTotal?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quotation Preview Card */}
              {selectedQuotation && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "24px", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Customer</span>
                      <div style={{ fontWeight: 600 }}>{selectedQuotation.customerSnapshot?.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{selectedQuotation.customerSnapshot?.companyName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Total Proposal Value</span>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#15803d" }}>
                        ₹{selectedQuotation.grandTotal?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginTop: "10px" }}>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Line Items Snapshot</span>
                    <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                      {selectedQuotation.lineItems?.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>
                          <strong>{item.description}</strong> — Qty: {item.quantity} × ₹{item.unitPrice?.toLocaleString()} ({item.billingFrequency || "monthly"})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                  disabled={submitting}
                >
                  <CheckCircle size={16} />
                  {submitting ? "Converting..." : "Convert to Subscription"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* TAB 2: MANUAL CREATION */
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 16px 0" }}>
            Configure New Subscription Contract
          </h2>

          <form onSubmit={handleManualCreate}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Customer *</label>
              <select
                className="form-control"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} - {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label">Select Plan *</label>
                <select
                  className="form-control"
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    const p = plans.find((x) => x._id === e.target.value);
                    if (p?.billingFrequency) setBillingFrequency(p.billingFrequency);
                  }}
                  required
                >
                  <option value="">-- Select Subscription Plan --</option>
                  {plans.map((p) => {
                    const price = p.price || p.pricing?.monthly || 0;
                    return (
                      <option key={p._id} value={p._id}>
                        {p.name} (₹{price.toLocaleString()} / {p.billingFrequency || "mo"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Billing Frequency *</label>
                <select
                  className="form-control"
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group">
                <label className="form-label">Quantity / Seats</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contract Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* Trial Checkbox */}
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={trialEnabled}
                  onChange={(e) => setTrialEnabled(e.target.checked)}
                />
                <span>Include Trial Period</span>
              </label>

              {trialEnabled && (
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#475569" }}>Trial Duration (Days):</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="form-control"
                    style={{ width: "100px" }}
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Subscription will start in <strong>Trial</strong> status and transition to <strong>Active</strong> upon trial completion.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Link to="/subscriptions" className="btn btn-outline">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                disabled={submitting}
              >
                <Plus size={16} />
                {submitting ? "Creating..." : "Create Subscription"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateSubscription;
