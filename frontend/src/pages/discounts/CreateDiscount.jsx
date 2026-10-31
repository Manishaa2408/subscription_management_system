import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Tag, Layers, CheckCircle, RefreshCw } from "lucide-react";
import discountService from "../../services/discountService";

export const CreateDiscount = () => {
  const navigate = useNavigate();
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Catalog data
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Section 1: Basic Details
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState("");

  // Section 2: Discount Configuration
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [minimumPurchase, setMinimumPurchase] = useState("0");

  // Section 3: Applicability
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [customerType, setCustomerType] = useState("all");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);

  // Section 4: Validity & Usage Limits
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maximumTotalUsage, setMaximumTotalUsage] = useState("");
  const [maximumPerCustomer, setMaximumPerCustomer] = useState("");

  // Section 5: Application Rules
  const [applicationType, setApplicationType] = useState("one_time");
  const [billingCycles, setBillingCycles] = useState("1");
  const [isStackable, setIsStackable] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await discountService.getCatalogData();
        setCampaigns(res.data?.campaigns || []);
        setProducts(res.data?.products || []);
        setPlans(res.data?.plans || []);
        setCustomers(res.data?.customers || []);
      } catch (err) {
        setError("Failed to load catalog options");
      } finally {
        setLoadingCatalog(false);
      }
    };
    loadCatalog();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !discountValue) {
      setError("Please fill all required fields (Name, Code, Discount Value)");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      campaignId: campaignId || null,
      discountType,
      discountValue: Number(discountValue),
      currency: currency.toUpperCase(),
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
      minimumPurchase: Number(minimumPurchase) || 0,
      applicability: {
        products: selectedProductIds,
        plans: selectedPlanIds,
        customerIds: selectedCustomerIds,
        customerType
      },
      usageLimits: {
        maximumTotalUsage: maximumTotalUsage ? Number(maximumTotalUsage) : null,
        maximumPerCustomer: maximumPerCustomer ? Number(maximumPerCustomer) : null
      },
      applicationType,
      billingCycles: applicationType === "recurring" ? Number(billingCycles) || 1 : 1,
      stacking: {
        isStackable
      },
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    try {
      setSubmitting(true);
      setError(null);
      const res = await discountService.createDiscount(payload);
      navigate(`/discounts/${res.data.discount._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create discount");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/discounts" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discounts
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Create Promotional Discount
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure discount codes, percentage/fixed calculations, customer eligibility, and recurring billing cycles.
        </p>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: BASIC INFORMATION */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            1. Basic Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Discount Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. New Year Welcome 20% Off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. WELCOME20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ fontFamily: "monospace", fontWeight: 600 }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Campaign (Optional)</label>
              <select
                className="form-control"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                <option value="">-- Standalone (No Campaign) --</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.campaignCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="Customer-facing or internal promo notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DISCOUNT CONFIGURATION */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            2. Discount Rules & Calculations
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Discount Type *</label>
              <select
                className="form-control"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                required
              >
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount Discount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {discountType === "percentage" ? "Percentage Value (%) *" : "Fixed Discount Amount (₹) *"}
              </label>
              <input
                type="number"
                min="0.01"
                max={discountType === "percentage" ? "100" : undefined}
                step="any"
                className="form-control"
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {discountType === "percentage" && (
              <div className="form-group">
                <label className="form-label">Maximum Discount Cap (₹) (Optional)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 500 (leave blank for no cap)"
                  value={maximumDiscount}
                  onChange={(e) => setMaximumDiscount(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Minimum Purchase Requirement (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="e.g. 999 (0 for no minimum)"
                value={minimumPurchase}
                onChange={(e) => setMinimumPurchase(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: APPLICABILITY */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            3. Scope & Customer Eligibility
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Customer Eligibility *</label>
              <select
                className="form-control"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
              >
                <option value="all">All Customers</option>
                <option value="new">New Customers Only (First Purchase)</option>
                <option value="existing">Existing Customers Only (Repeat Purchase)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Specific Customer Whitelist (Optional)</label>
              <select
                className="form-control"
                onChange={(e) => {
                  if (e.target.value && !selectedCustomerIds.includes(e.target.value)) {
                    setSelectedCustomerIds([...selectedCustomerIds, e.target.value]);
                  }
                }}
              >
                <option value="">-- Add Customer Whitelist --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>

              {selectedCustomerIds.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {selectedCustomerIds.map((cid) => {
                    const cust = customers.find((c) => c._id === cid);
                    return (
                      <span key={cid} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                        {cust?.name || cid}
                        <button
                          type="button"
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#b91c1c" }}
                          onClick={() => setSelectedCustomerIds(selectedCustomerIds.filter((id) => id !== cid))}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Eligible Plans (Leave empty to apply to all plans)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {plans.map((p) => {
                const isChecked = selectedPlanIds.includes(p._id);
                return (
                  <label key={p._id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlanIds([...selectedPlanIds, p._id]);
                        } else {
                          setSelectedPlanIds(selectedPlanIds.filter((id) => id !== p._id));
                        }
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: VALIDITY & USAGE LIMITS */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            4. Validity & Usage Limits
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Start Date (Optional)</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date (Expiry) (Optional)</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Maximum Total Usages (Global limit)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Leave blank for unlimited"
                value={maximumTotalUsage}
                onChange={(e) => setMaximumTotalUsage(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Usages Per Customer</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 1 (one redemption per customer)"
                value={maximumPerCustomer}
                onChange={(e) => setMaximumPerCustomer(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: APPLICATION RULES */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            5. Application & Stacking Rules
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Application Type *</label>
              <select
                className="form-control"
                value={applicationType}
                onChange={(e) => setApplicationType(e.target.value)}
              >
                <option value="one_time">One-Time Discount (First payment only)</option>
                <option value="recurring">Recurring Discount (N billing cycles)</option>
              </select>
            </div>

            {applicationType === "recurring" && (
              <div className="form-group">
                <label className="form-label">Number of Billing Cycles *</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="form-control"
                  value={billingCycles}
                  onChange={(e) => setBillingCycles(e.target.value)}
                  required
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Discount will apply for this number of recurring billing periods in M9.
                </span>
              </div>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isStackable}
              onChange={(e) => setIsStackable(e.target.checked)}
            />
            <span>Allow stacking with other eligible promotional discounts</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Link to="/discounts" className="btn btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "10px 24px" }}
            disabled={submitting}
          >
            {submitting ? "Creating Discount..." : "Create Discount"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDiscount;
