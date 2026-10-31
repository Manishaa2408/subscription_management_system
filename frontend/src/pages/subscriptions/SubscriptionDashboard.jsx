import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight,
  Eye,
  SlidersHorizontal
} from "lucide-react";
import subscriptionService from "../../services/subscriptionService";
import SubscriptionStatusBadge from "../../components/subscriptions/SubscriptionStatusBadge";
import { useAuth } from "../../context/AuthContext";

export const SubscriptionDashboard = () => {
  const { role } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subData, metricData] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getMetrics()
      ]);
      setSubscriptions(subData.data?.subscriptions || []);
      setMetrics(metricData.data?.metrics || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subscriptions client-side for fast UX
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesSearch =
      !search ||
      sub.subscriptionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      sub.customerSnapshot?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.customerSnapshot?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      sub.lineItems?.[0]?.planSnapshot?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Subscription Lifecycle Management
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
            Manage Brightloop customer subscriptions, trial conversions, renewals, and recurring billing synchronization.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>

          {role !== "customer" && (
            <Link
              to="/subscriptions/create"
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> New Subscription
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Total Subscriptions</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
              {metrics.totalSubscriptions || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Across all states</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #86efac", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#15803d", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Active Subscriptions</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
              {metrics.statusCounts?.active || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "4px" }}>Generating recurring revenue</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #c7d2fe", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#4338ca", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Trial Periods</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4338ca", marginTop: "4px" }}>
              {metrics.statusCounts?.trial || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6366f1", marginTop: "4px" }}>Evaluations underway</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#b45309", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Paused</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
              {metrics.statusCounts?.paused || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#d97706", marginTop: "4px" }}>Temporarily suspended</div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#0f172a", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Active Contract Value</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
              ₹{(metrics.financials?.activeContractValue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Active run-rate</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by subscription #, customer name, company, or plan..."
              style={{ paddingLeft: "36px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={15} /> Status:
          </span>
          <select
            className="form-control"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses ({subscriptions.length})</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="pending">Pending</option>
            <option value="paused">Paused</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Subscriptions Table */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
            <p>Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <AlertCircle size={28} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
            <p style={{ fontWeight: 500, fontSize: "1rem" }}>No subscriptions found matching your query.</p>
            <span style={{ fontSize: "0.85rem" }}>
              Try adjusting your search criteria or create a new subscription.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="items-table" style={{ width: "100%", margin: 0 }}>
              <thead>
                <tr>
                  <th>Subscription #</th>
                  <th>Customer</th>
                  <th>Primary Plan</th>
                  <th>Status</th>
                  <th>Current Period End</th>
                  <th>Next Billing</th>
                  <th>Amount</th>
                  <th>M9 Sync</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => {
                  const primaryPlan = sub.lineItems?.[0]?.planSnapshot || {};
                  return (
                    <tr key={sub._id}>
                      <td>
                        <Link
                          to={`/subscriptions/${sub._id}`}
                          style={{ fontWeight: 600, color: "#2563eb", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          {sub.subscriptionNumber}
                        </Link>
                        {sub.quotationSnapshot?.quotationNumber && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Via {sub.quotationSnapshot.quotationNumber}
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>{sub.customerSnapshot?.name || "Customer"}</strong>
                        {sub.customerSnapshot?.companyName && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {sub.customerSnapshot.companyName}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{primaryPlan.name || "Custom Plan"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "capitalize" }}>
                          {sub.lineItems?.[0]?.billingFrequency || "monthly"} cycle
                        </div>
                      </td>

                      <td>
                        <SubscriptionStatusBadge status={sub.status} />
                      </td>

                      <td style={{ fontSize: "0.85rem" }}>
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>

                      <td style={{ fontSize: "0.85rem" }}>
                        {sub.nextBillingDate ? (
                          <strong style={{ color: "#2563eb" }}>
                            {new Date(sub.nextBillingDate).toLocaleDateString()}
                          </strong>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td>
                        <strong>₹{(sub.totalAmount || 0).toLocaleString()}</strong>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            backgroundColor:
                              sub.billingIntegration?.status === "registered" ? "#dcfce7" :
                              sub.billingIntegration?.status === "failed" ? "#fee2e2" : "#f1f5f9",
                            color:
                              sub.billingIntegration?.status === "registered" ? "#15803d" :
                              sub.billingIntegration?.status === "failed" ? "#b91c1c" : "#475569"
                          }}
                        >
                          {sub.billingIntegration?.status || "pending"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/subscriptions/${sub._id}`}
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
