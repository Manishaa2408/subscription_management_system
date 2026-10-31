import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import discountService from "../../services/discountService";

export const EditDiscount = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Discount fields
  const [discount, setDiscount] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [minimumPurchase, setMinimumPurchase] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maximumTotalUsage, setMaximumTotalUsage] = useState("");
  const [maximumPerCustomer, setMaximumPerCustomer] = useState("");
  const [applicationType, setApplicationType] = useState("one_time");
  const [billingCycles, setBillingCycles] = useState("1");
  const [isStackable, setIsStackable] = useState(false);
  const [status, setStatus] = useState("active");

  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [discRes, campRes] = await Promise.all([
          discountService.getDiscountById(id),
          discountService.getCampaigns()
        ]);

        const d = discRes.data?.discount;
        setDiscount(d);
        setName(d.name || "");
        setCode(d.code || "");
        setDescription(d.description || "");
        setCampaignId(d.campaignId?._id || d.campaignId || "");
        setDiscountType(d.discountType || "percentage");
        setDiscountValue(d.discountValue?.toString() || "");
        setMaximumDiscount(d.maximumDiscount?.toString() || "");
        setMinimumPurchase(d.minimumPurchase?.toString() || "0");
        setStartDate(d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "");
        setEndDate(d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "");
        setMaximumTotalUsage(d.usageLimits?.maximumTotalUsage?.toString() || "");
        setMaximumPerCustomer(d.usageLimits?.maximumPerCustomer?.toString() || "");
        setApplicationType(d.applicationType || "one_time");
        setBillingCycles(d.billingCycles?.toString() || "1");
        setIsStackable(d.stacking?.isStackable || false);
        setStatus(d.status || "active");

        setCampaigns(campRes.data?.campaigns || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load discount.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !discountValue) {
      setError("Please fill all required fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      campaignId: campaignId || null,
      discountType,
      discountValue: Number(discountValue),
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
      minimumPurchase: Number(minimumPurchase) || 0,
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
      endDate: endDate ? new Date(endDate) : null,
      status
    };

    try {
      setSubmitting(true);
      setError(null);
      await discountService.updateDiscount(id, payload);
      navigate(`/discounts/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update discount.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: "860px", margin: "0 auto", padding: "40px", textAlign: "center", color: "#64748b" }}>
        <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
        <p>Loading discount configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to={`/discounts/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discount Details
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Edit Discount – <span className="font-mono text-blue-600">{discount?.code}</span>
        </h1>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            Basic Information & Campaign
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Discount Name *</label>
              <input
                type="text"
                className="form-control"
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
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={discount?.usageCount > 0}
                required
              />
              {discount?.usageCount > 0 && (
                <span style={{ fontSize: "0.75rem", color: "#b45309" }}>
                  Code locked because {discount.usageCount} redemption(s) already recorded.
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Campaign</label>
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
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive (Paused)</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Calculation & Limits */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 16px 0", color: "#0f172a" }}>
            Calculation & Limits
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
              <label className="form-label">Discount Value *</label>
              <input
                type="number"
                min="0.01"
                step="any"
                className="form-control"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {discountType === "percentage" && (
              <div className="form-group">
                <label className="form-label">Maximum Discount Cap (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
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
                value={minimumPurchase}
                onChange={(e) => setMinimumPurchase(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date (Expiry)</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Link to={`/discounts/${id}`} className="btn btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "10px 24px" }}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDiscount;
