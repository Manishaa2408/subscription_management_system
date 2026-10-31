import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  RotateCcw
} from "lucide-react";
import subscriptionService from "../../services/subscriptionService";
import SubscriptionStatusBadge from "../../components/subscriptions/SubscriptionStatusBadge";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";

export const SubscriptionDashboard = () => {
  const navigate = useNavigate();
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Subscription Management"
        subtitle="Manage customer subscriptions, trial conversions, renewals, and recurring billing synchronization."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>

            {role !== "customer" && (
              <Link
                to="/subscriptions/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Subscription
              </Link>
            )}
          </div>
        }
      />

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Subscriptions"
            value={metrics.totalSubscriptions || 0}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="Active"
            value={metrics.statusCounts?.active || 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Trial Periods"
            value={metrics.statusCounts?.trial || 0}
            icon={Clock}
            color="indigo"
          />
          <StatCard
            label="Paused"
            value={metrics.statusCounts?.paused || 0}
            icon={PauseCircle}
            color="amber"
          />
          <StatCard
            label="Contract Value"
            value={formatCurrency(metrics.financials?.activeContractValue || 0)}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Search by subscription #, customer, company, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
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

          {(search || statusFilter !== "all") && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Subscriptions Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading subscriptions..." />
        ) : filteredSubscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions found"
            description="No active or pending subscriptions match your search filter."
            actionText={role !== "customer" ? "Create Subscription" : undefined}
            onAction={role !== "customer" ? () => navigate("/subscriptions/create") : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Subscription #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Primary Plan</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Period End</th>
                  <th className="px-5 py-3.5">Next Billing</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Billing Sync</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((sub) => {
                  const primaryPlan = sub.lineItems?.[0]?.planSnapshot || {};
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-blue-600">
                        <Link to={`/subscriptions/${sub._id}`} className="hover:underline">
                          {sub.subscriptionNumber}
                        </Link>
                        {sub.quotationSnapshot?.quotationNumber && (
                          <div className="text-xs text-slate-400 font-normal">
                            Quote: {sub.quotationSnapshot.quotationNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{sub.customerSnapshot?.name}</div>
                        {sub.customerSnapshot?.companyName && (
                          <div className="text-xs text-slate-500">{sub.customerSnapshot.companyName}</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{primaryPlan.name || "Custom Plan"}</div>
                        <div className="text-xs text-slate-400 capitalize">
                          {primaryPlan.billingFrequency || primaryPlan.billingInterval || "Monthly"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <SubscriptionStatusBadge status={sub.status} />
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(sub.recurringAmount || sub.grandTotal)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {sub.billingScheduleId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/subscriptions/${sub._id}`}
                          className="inline-flex items-center gap-1 p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Subscription Details"
                        >
                          <Eye className="w-4 h-4" />
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
