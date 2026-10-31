import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import QuotationStatusBadge from "../../components/quotations/QuotationStatusBadge";
import QuotationPreviewModal from "../../components/quotations/QuotationPreviewModal";
import {
  Plus, Eye, Edit2, Send, FileText, XCircle, Search, Filter,
  CheckCircle, ArrowUpRight, RotateCcw, ChevronLeft, ChevronRight
} from "lucide-react";

export const QuotationDashboard = () => {
  const navigate = useNavigate();
  const { role, isAdmin, isStaff, isCustomer } = useAuth();

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
    if (!window.confirm(`Convert accepted quotation ${num} into a subscription (M7)?`)) return;
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
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotation Management</h1>
          <p className="page-subtitle">
            Manage commercial proposals, track customer approvals, and prepare accepted quotations for subscription lifecycle (M7).
          </p>
        </div>

        {!isCustomer && (
          <Link to="/quotations/create" className="btn btn-primary">
            <Plus size={16} /> New Quotation
          </Link>
        )}
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ margin: 0, padding: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>Total Proposals</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{metrics.total}</div>
          </div>

          <div className="card" style={{ margin: 0, padding: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>Drafts</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#475569" }}>{metrics.draft}</div>
          </div>

          <div className="card" style={{ margin: 0, padding: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#0284c7", textTransform: "uppercase" }}>Sent & Pending</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0284c7" }}>{metrics.sent}</div>
          </div>

          <div className="card" style={{ margin: 0, padding: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#16a34a", textTransform: "uppercase" }}>Accepted Proposals</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16a34a" }}>{metrics.accepted}</div>
          </div>

          <div className="card" style={{ margin: 0, padding: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#d97706", textTransform: "uppercase" }}>Expired</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706" }}>{metrics.expired}</div>
          </div>

          <div className="card" style={{ margin: 0, padding: "16px", background: "#f8fafc" }}>
            <div style={{ fontSize: "0.8rem", color: "#1e40af", textTransform: "uppercase", fontWeight: 700 }}>Accepted Pipeline</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e40af" }}>{formatCurrency(metrics.acceptedRevenue)}</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: "36px" }}
              placeholder="Search by quotation number or customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="#64748b" />
            <select className="form-control" style={{ width: "160px" }} value={status} onChange={e => setStatus(e.target.value)}>
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
              className="btn btn-outline btn-sm"
              onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Quotation Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "140px" }}>Quotation #</th>
                <th>Customer</th>
                <th style={{ width: "110px" }}>Date</th>
                <th style={{ width: "110px" }}>Valid Until</th>
                <th style={{ width: "130px", textAlign: "right" }}>Total</th>
                <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                <th style={{ width: "180px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading quotations from database...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q._id}>
                    <td style={{ fontWeight: 700, color: "#1e40af" }}>
                      <Link to={`/quotations/${q._id}`}>{q.quotationNumber}</Link>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{q.customerSnapshot?.name}</div>
                      {q.customerSnapshot?.companyName && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{q.customerSnapshot.companyName}</div>
                      )}
                    </td>

                    <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {new Date(q.quotationDate).toLocaleDateString()}
                    </td>

                    <td style={{ fontSize: "0.85rem", color: q.status === "expired" ? "#dc2626" : "#475569" }}>
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(q.grandTotal)}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <QuotationStatusBadge status={q.status} />
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button className="btn btn-outline btn-sm" title="View Details" onClick={() => navigate(`/quotations/${q._id}`)}>
                          <Eye size={14} />
                        </button>

                        <button className="btn btn-outline btn-sm" title="Preview Proposal" onClick={() => setPreviewQuotation(q)}>
                          <FileText size={14} />
                        </button>

                        {!isCustomer && q.status === "draft" && (
                          <>
                            <button className="btn btn-outline btn-sm" title="Edit Draft" onClick={() => navigate(`/quotations/${q._id}/edit`)}>
                              <Edit2 size={14} />
                            </button>

                            <button className="btn btn-primary btn-sm" title="Send to Customer" onClick={() => handleSend(q._id, q.quotationNumber)}>
                              <Send size={14} />
                            </button>
                          </>
                        )}

                        {!isCustomer && q.status === "accepted" && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ background: "#7c3aed" }}
                            title="Convert to M7 Subscription"
                            onClick={() => handleConvert(q._id, q.quotationNumber)}
                            disabled={q.subscriptionConversion?.status === "converted"}
                          >
                            <ArrowUpRight size={14} /> {q.subscriptionConversion?.status === "converted" ? "Converted" : "Convert"}
                          </button>
                        )}

                        {!isCustomer && ["draft", "sent"].includes(q.status) && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: "#dc2626" }}
                            title="Cancel Quotation"
                            onClick={() => handleCancel(q._id, q.quotationNumber)}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing {quotations.length} of {pagination.total} quotations
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{page} / {pagination.totalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewQuotation && (
        <QuotationPreviewModal quotation={previewQuotation} onClose={() => setPreviewQuotation(null)} />
      )}
    </div>
  );
};

export default QuotationDashboard;
