import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Tag, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Megaphone,
  Eye,
  Edit,
  TrendingDown,
  Layers
} from "lucide-react";
import discountService from "../../services/discountService";
import DiscountStatusBadge from "../../components/discounts/DiscountStatusBadge";
import CampaignModal from "../../components/discounts/CampaignModal";
import { useAuth } from "../../context/AuthContext";

export const DiscountDashboard = () => {
  const { role, isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  // Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [discRes, campRes, metricRes] = await Promise.all([
        discountService.getDiscounts(),
        discountService.getCampaigns(),
        discountService.getMetrics()
      ]);
      setDiscounts(discRes.data?.discounts || []);
      setCampaigns(campRes.data?.campaigns || []);
      setMetrics(metricRes.data?.metrics || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusToggle = async (discount) => {
    const newStatus = discount.status === "active" ? "inactive" : "active";
    try {
      await discountService.updateDiscountStatus(discount._id, newStatus);
      setNotification({ type: "success", text: `Discount '${discount.code}' marked ${newStatus}` });
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Status update failed");
    }
  };

  const handleArchive = async (discount) => {
    if (!window.confirm(`Are you sure you want to archive discount '${discount.code}'?`)) return;
    try {
      await discountService.archiveDiscount(discount._id);
      setNotification({ type: "success", text: `Discount '${discount.code}' archived` });
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Archive failed");
    }
  };

  // Filter discounts client-side for ultra-fast response
  const filteredDiscounts = discounts.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesType = typeFilter === "all" || d.discountType === typeFilter;
    const matchesCampaign = campaignFilter === "all" || (d.campaignId?._id || d.campaignId) === campaignFilter;
    const matchesSearch =
      !search ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesCampaign && matchesSearch;
  });

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Discount & Campaign Management
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
            Create promotional coupons, percentage/fixed discounts, eligibility restrictions, and track redemptions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>

          <Link
            to="/discounts/tester"
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Sparkles size={15} color="#2563eb" /> Coupon Tester
          </Link>

          {isAdmin && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setIsCampaignModalOpen(true)}
              >
                <Megaphone size={15} color="#7c3aed" /> New Campaign
              </button>

              <Link
                to="/discounts/create"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={16} /> New Discount
              </Link>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "16px" }}>
          {notification.text}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Metrics Row */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Total Discounts</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
              {metrics.totalDiscounts || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Configured coupons</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #86efac", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#15803d", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Active Coupons</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
              {metrics.activeDiscounts || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "4px" }}>Available for checkout</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#b45309", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Inactive / Expired</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
              {(metrics.inactiveDiscounts || 0) + (metrics.expiredDiscounts || 0)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#d97706", marginTop: "4px" }}>Paused or lapsed</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #c7d2fe", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#4338ca", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Total Redemptions</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4338ca", marginTop: "4px" }}>
              {metrics.totalRedemptions || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6366f1", marginTop: "4px" }}>Confirmed usages</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Customer Savings</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
              ₹{(metrics.totalAmountSaved || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Total value redeemed</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "240px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by discount code, name, or description..."
              style={{ paddingLeft: "36px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status filter */}
          <select
            className="form-control"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>

          {/* Type filter */}
          <select
            className="form-control"
            style={{ width: "auto" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>

          {/* Campaign filter */}
          <select
            className="form-control"
            style={{ width: "auto" }}
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discounts Table */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
            <p>Loading discounts...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <Tag size={28} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
            <p style={{ fontWeight: 500, fontSize: "1rem" }}>No discounts found matching your filters.</p>
            <span style={{ fontSize: "0.85rem" }}>
              Try adjusting your search criteria or create a new coupon.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="items-table" style={{ width: "100%", margin: 0 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount Name</th>
                  <th>Rule / Value</th>
                  <th>Min Order</th>
                  <th>Campaign</th>
                  <th>Usage / Cap</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <Link
                        to={`/discounts/${d._id}`}
                        style={{
                          fontWeight: 700,
                          color: "#2563eb",
                          fontFamily: "monospace",
                          fontSize: "0.95rem",
                          letterSpacing: "0.04em"
                        }}
                      >
                        {d.code}
                      </Link>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "capitalize" }}>
                        {d.applicationType === "recurring" ? `Recurring (${d.billingCycles}x)` : "One-Time"}
                      </div>
                    </td>

                    <td>
                      <strong>{d.name}</strong>
                      {d.description && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <strong style={{ color: "#15803d" }}>
                        {d.discountType === "percentage"
                          ? `${d.discountValue}% Off`
                          : `₹${d.discountValue?.toLocaleString()} Flat`}
                      </strong>
                      {d.maximumDiscount != null && d.maximumDiscount > 0 && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          Max cap: ₹{d.maximumDiscount.toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td>
                      {d.minimumPurchase > 0 ? (
                        <span>₹{d.minimumPurchase.toLocaleString()}</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>None</span>
                      )}
                    </td>

                    <td>
                      {d.campaignId ? (
                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                          {d.campaignId.name || d.campaignId.campaignCode}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Standalone</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {d.usageCount || 0}
                        {d.usageLimits?.maximumTotalUsage ? ` / ${d.usageLimits.maximumTotalUsage}` : " (unlimited)"}
                      </div>
                      {d.usageLimits?.maximumPerCustomer && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          Max {d.usageLimits.maximumPerCustomer}/customer
                        </div>
                      )}
                    </td>

                    <td>
                      <DiscountStatusBadge status={d.status} />
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Link
                          to={`/discounts/${d._id}`}
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              to={`/discounts/${d._id}/edit`}
                              className="btn btn-outline"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Edit"
                            >
                              <Edit size={13} />
                            </Link>

                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                color: d.status === "active" ? "#b45309" : "#15803d"
                              }}
                              onClick={() => handleStatusToggle(d)}
                              title={d.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {d.status === "active" ? "Pause" : "Enable"}
                            </button>

                            {d.status !== "archived" && (
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#64748b" }}
                                onClick={() => handleArchive(d)}
                                title="Archive"
                              >
                                <Archive size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Creation Modal */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={(msg) => {
          setNotification({ type: "success", text: msg });
          fetchData();
        }}
      />
    </div>
  );
};

export default DiscountDashboard;
