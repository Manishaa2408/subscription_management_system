import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Tag, 
  Edit, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Sparkles,
  Users,
  Layers,
  Megaphone,
  TrendingDown
} from "lucide-react";
import discountService from "../../services/discountService";
import DiscountStatusBadge from "../../components/discounts/DiscountStatusBadge";
import DiscountTimeline from "../../components/discounts/DiscountTimeline";
import DiscountUsageHistory from "../../components/discounts/DiscountUsageHistory";
import DiscountValidationPreview from "../../components/discounts/DiscountValidationPreview";
import { useAuth } from "../../context/AuthContext";

export const DiscountDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [discount, setDiscount] = useState(null);
  const [usages, setUsages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [catalog, setCatalog] = useState({ customers: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Tabs: "overview", "usage", "activity", "tester"
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [discRes, usageRes, actRes, catRes] = await Promise.all([
        discountService.getDiscountById(id),
        discountService.getDiscountUsage(id),
        discountService.getDiscountActivity(id),
        discountService.getCatalogData().catch(() => ({ data: { customers: [], plans: [] } }))
      ]);

      setDiscount(discRes.data?.discount || null);
      setUsages(usageRes.data?.usage || []);
      setActivities(actRes.data?.activity || []);
      setCatalog(catRes.data || { customers: [], plans: [] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load discount details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusToggle = async () => {
    const newStatus = discount.status === "active" ? "inactive" : "active";
    try {
      await discountService.updateDiscountStatus(discount._id, newStatus);
      setNotification({ type: "success", text: `Discount marked ${newStatus}` });
      loadData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError("Status update failed");
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px", textAlign: "center", color: "#64748b" }}>
        <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
        <p>Loading discount details...</p>
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
        <div className="alert alert-error">{error || "Discount not found"}</div>
        <Link to="/discounts" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Discounts
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: "16px" }}>
        <Link to="/discounts" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Discounts
        </Link>
      </div>

      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "16px" }}>
          {notification.text}
        </div>
      )}

      {/* Main Header Card */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#2563eb",
                  letterSpacing: "0.05em",
                  background: "#eff6ff",
                  padding: "2px 10px",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe"
                }}
              >
                {discount.code}
              </span>
              <DiscountStatusBadge status={discount.status} />
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 4px 0", color: "#0f172a" }}>
              {discount.name}
            </h2>

            {discount.description && (
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
                {discount.description}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {isAdmin && (
              <>
                <Link
                  to={`/discounts/${discount._id}/edit`}
                  className="btn btn-outline"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Edit size={14} /> Edit
                </Link>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleStatusToggle}
                  style={{ color: discount.status === "active" ? "#b45309" : "#15803d" }}
                >
                  {discount.status === "active" ? "Pause Coupon" : "Activate Coupon"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Discount Formula</span>
            <strong style={{ color: "#15803d", fontSize: "1rem" }}>
              {discount.discountType === "percentage"
                ? `${discount.discountValue}% Off`
                : `₹${discount.discountValue?.toLocaleString()} Flat`}
            </strong>
          </div>

          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Maximum Discount Cap</span>
            <strong>
              {discount.maximumDiscount ? `₹${discount.maximumDiscount.toLocaleString()}` : "No Maximum Cap"}
            </strong>
          </div>

          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Minimum Order Total</span>
            <strong>
              {discount.minimumPurchase ? `₹${discount.minimumPurchase.toLocaleString()}` : "None (₹0)"}
            </strong>
          </div>

          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Total Usages Recorded</span>
            <strong style={{ color: "#2563eb" }}>
              {discount.usageCount || 0}
              {discount.usageLimits?.maximumTotalUsage ? ` / ${discount.usageLimits.maximumTotalUsage}` : " (unlimited)"}
            </strong>
          </div>

          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Application Type</span>
            <strong style={{ textTransform: "capitalize" }}>
              {discount.applicationType === "recurring" ? `Recurring (${discount.billingCycles}x)` : "One-Time"}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "overview" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "overview" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Rules & Applicability
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tester")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "tester" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "tester" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Sparkles size={15} color="#2563eb" /> Live Coupon Tester
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "usage" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "usage" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Usage & Redemptions ({usages.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "activity" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "activity" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Audit Activity ({activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & RULES */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
              Applicability & Eligibility Configuration
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", fontSize: "0.875rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Associated Campaign</span>
                <strong>
                  {discount.campaignId ? (
                    <span>{discount.campaignId.name} ({discount.campaignId.campaignCode})</span>
                  ) : (
                    "Standalone (No Campaign)"
                  )}
                </strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Customer Eligibility</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {discount.applicability?.customerType === "new" ? "New Customers Only" :
                   discount.applicability?.customerType === "existing" ? "Existing Customers Only" :
                   "All Customers"}
                </strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Validity Window</span>
                <span>
                  {discount.startDate ? new Date(discount.startDate).toLocaleDateString() : "Immediate"}
                  {" — "}
                  {discount.endDate ? new Date(discount.endDate).toLocaleDateString() : "No Expiry"}
                </span>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Per-Customer Limit</span>
                <strong>
                  {discount.usageLimits?.maximumPerCustomer
                    ? `Max ${discount.usageLimits.maximumPerCustomer} use(s) per customer`
                    : "No per-customer limit"}
                </strong>
              </div>

              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Stacking Policy</span>
                <span>
                  {discount.stacking?.isStackable ? "Stackable with other offers" : "Exclusive (Cannot be combined)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TESTER */}
      {activeTab === "tester" && (
        <DiscountValidationPreview
          initialCode={discount.code}
          customers={catalog.customers}
          plans={catalog.plans}
        />
      )}

      {/* TAB 3: REDEMPTIONS */}
      {activeTab === "usage" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
            Usage & Redemption History
          </h3>
          <DiscountUsageHistory usages={usages} />
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY */}
      {activeTab === "activity" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
            Audit Activity Trail
          </h3>
          <DiscountTimeline activities={activities} />
        </div>
      )}
    </div>
  );
};

export default DiscountDetails;
