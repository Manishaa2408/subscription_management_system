import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Layers,
  RotateCcw,
  Percent,
  Power
} from "lucide-react";
import discountService from "../../services/discountService";
import DiscountStatusBadge from "../../components/discounts/DiscountStatusBadge";
import CampaignModal from "../../components/discounts/CampaignModal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";

export const DiscountDashboard = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Discounts & Coupons"
        subtitle="Create promotional coupon codes, percentage/fixed discounts, eligibility restrictions, and track redemptions."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>

            <Link
              to="/discounts/tester"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Coupon Tester
            </Link>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-semibold transition"
                >
                  <Megaphone className="w-3.5 h-3.5" /> New Campaign
                </button>

                <Link
                  to="/discounts/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Discount
                </Link>
              </>
            )}
          </div>
        }
      />

      {notification && (
        <div className={`p-4 rounded-xl text-sm font-medium ${notification.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {notification.text}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Discounts"
            value={metrics.totalDiscounts || 0}
            icon={Tag}
            color="blue"
          />
          <StatCard
            label="Active Coupons"
            value={metrics.activeDiscounts || 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Inactive / Expired"
            value={(metrics.inactiveDiscounts || 0) + (metrics.expiredDiscounts || 0)}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Redemptions"
            value={metrics.totalRedemptions || 0}
            icon={Sparkles}
            color="indigo"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Search by code, coupon name, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <select
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed_amount">Fixed Amount (₹)</option>
          </select>

          {campaigns.length > 0 && (
            <select
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}

          {(search || statusFilter !== "all" || typeFilter !== "all" || campaignFilter !== "all") && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setTypeFilter("all");
                setCampaignFilter("all");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Discounts Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading discounts..." />
        ) : filteredDiscounts.length === 0 ? (
          <EmptyState
            title="No discounts found"
            description="No promotional coupons match your current filter settings."
            actionText={isAdmin ? "Create Discount" : undefined}
            onAction={isAdmin ? () => navigate("/discounts/create") : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Benefit</th>
                  <th className="px-5 py-3.5">Campaign</th>
                  <th className="px-5 py-3.5 text-center">Usage</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Validity</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiscounts.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                        {d.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{d.name}</div>
                      {d.description && (
                        <div className="text-xs text-slate-400 max-w-xs truncate mt-0.5">{d.description}</div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {d.discountType === "percentage" ? (
                        <span className="text-blue-600 font-bold">{d.value}% OFF</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">₹{d.value} OFF</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600">
                      {d.campaignId?.name || "General"}
                    </td>

                    <td className="px-5 py-4 text-center text-xs font-medium text-slate-700">
                      {d.currentRedemptions || 0} {d.maxRedemptions ? `/ ${d.maxRedemptions}` : "used"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <DiscountStatusBadge status={d.status} />
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {d.validUntil ? new Date(d.validUntil).toLocaleDateString() : "No expiry"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/discounts/${d._id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              to={`/discounts/${d._id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Discount"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleStatusToggle(d)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                              title={d.status === "active" ? "Deactivate" : "Activate"}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleArchive(d)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Archive Discount"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
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

      {/* Campaign Modal */}
      {isCampaignModalOpen && (
        <CampaignModal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          onSuccess={() => {
            setIsCampaignModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default DiscountDashboard;
