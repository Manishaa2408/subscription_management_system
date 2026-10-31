import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import QuotationStatusBadge from "../../components/quotations/QuotationStatusBadge";
import QuotationPreviewModal from "../../components/quotations/QuotationPreviewModal";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import {
  Plus, Eye, Edit2, Send, FileText, XCircle, Search, Filter,
  CheckCircle, ArrowUpRight, RotateCcw, ChevronLeft, ChevronRight,
  FileCheck, Clock, AlertTriangle, TrendingUp
} from "lucide-react";

export const QuotationDashboard = () => {
  const navigate = useNavigate();
  const { role, isCustomer } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [previewQuotation, setPreviewQuotation] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [quotRes, metricsRes] = await Promise.all([
        quotationService.getQuotations({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined
        }),
        quotationService.getDashboardMetrics()
      ]);

      setQuotations(quotRes.data.quotations || []);
      setPagination(quotRes.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setMetrics(metricsRes);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, status, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSend = async (id, num) => {
    if (!window.confirm(`Are you sure you want to finalize and send quotation ${num} to the customer?`)) return;
    try {
      await quotationService.sendQuotation(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send quotation");
    }
  };

  const handleCancel = async (id, num) => {
    const reason = window.prompt(`Please enter cancellation reason for ${num}:`);
    if (reason === null) return;
    try {
      await quotationService.cancelQuotation(id, reason);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel quotation");
    }
  };

  const handleConvert = async (id, num) => {
    if (!window.confirm(`Convert accepted quotation ${num} into an active subscription?`)) return;
    try {
      const res = await quotationService.convertQuotation(id);
      alert(`Success! Subscription created: ${res.data.subscriptionId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to convert quotation");
    }
  };

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
        title="Quotation Management"
        subtitle="Manage commercial proposals, track customer approvals, and prepare accepted quotations for subscription activation."
        action={
          !isCustomer && (
            <Link
              to="/quotations/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Quotation
            </Link>
          )
        }
      />

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Proposals"
            value={metrics.total || 0}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Drafts"
            value={metrics.draft || 0}
            icon={Clock}
            color="slate"
          />
          <StatCard
            label="Sent & Pending"
            value={metrics.sent || 0}
            icon={Send}
            color="blue"
          />
          <StatCard
            label="Accepted"
            value={metrics.accepted || 0}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Expired"
            value={metrics.expired || 0}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(metrics.acceptedRevenue)}
            icon={TrendingUp}
            color="indigo"
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
            placeholder="Search by quotation number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(search || status) && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPage(1);
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

      {/* Quotation Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading quotations..." />
        ) : quotations.length === 0 ? (
          <EmptyState
            title="No quotations found"
            description="No quotation records match your filter criteria. Create a new quotation to get started."
            actionText={!isCustomer ? "Create Quotation" : undefined}
            onAction={!isCustomer ? () => navigate("/quotations/create") : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Quotation #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Valid Until</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-blue-600">
                      <Link to={`/quotations/${q._id}`} className="hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{q.customerSnapshot?.name}</div>
                      {q.customerSnapshot?.companyName && (
                        <div className="text-xs text-slate-500">{q.customerSnapshot.companyName}</div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600">
                      {new Date(q.quotationDate).toLocaleDateString()}
                    </td>

                    <td className={`px-5 py-4 text-xs ${q.status === "expired" ? "text-rose-600 font-medium" : "text-slate-600"}`}>
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(q.grandTotal)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <QuotationStatusBadge status={q.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                          onClick={() => navigate(`/quotations/${q._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Preview Proposal"
                          onClick={() => setPreviewQuotation(q)}
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {!isCustomer && q.status === "draft" && (
                          <>
                            <button
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Draft"
                              onClick={() => navigate(`/quotations/${q._id}/edit`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Send to Customer"
                              onClick={() => handleSend(q._id, q.quotationNumber)}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {!isCustomer && q.status === "accepted" && (
                          <button
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                              q.subscriptionConversion?.status === "converted"
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                            }`}
                            title="Convert to Subscription"
                            onClick={() => handleConvert(q._id, q.quotationNumber)}
                            disabled={q.subscriptionConversion?.status === "converted"}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {q.subscriptionConversion?.status === "converted" ? "Converted" : "Convert"}
                          </button>
                        )}

                        {!isCustomer && ["draft", "sent"].includes(q.status) && (
                          <button
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Cancel Quotation"
                            onClick={() => handleCancel(q._id, q.quotationNumber)}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing {quotations.length} of {pagination.total} quotations
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
              </button>
              <span className="font-semibold text-slate-700">
                {page} / {pagination.totalPages}
              </span>
              <button
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewQuotation && (
        <QuotationPreviewModal
          quotation={previewQuotation}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </div>
  );
};

export default QuotationDashboard;
