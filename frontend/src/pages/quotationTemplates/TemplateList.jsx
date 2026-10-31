import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import { useAuth } from "../../context/AuthContext";
import TemplateFilters from "../../components/quotationTemplates/TemplateFilters";
import TemplateStatusBadge from "../../components/quotationTemplates/TemplateStatusBadge";
import TemplatePreview from "../../components/quotationTemplates/TemplatePreview";
import { Plus, Eye, Edit2, Trash2, Power, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

export const TemplateList = () => {
  const navigate = useNavigate();
  const { role, isAdmin, isStaff, isCustomer } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Customer has NO access to M5 template management
  if (isCustomer) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
          Access Denied
        </h2>
        <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto" }}>
          Customer accounts cannot view or manage internal quotation templates. Please switch to an <strong>Admin</strong> or <strong>Staff</strong> role above to test M5.
        </p>
      </div>
    );
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 8,
        search: search.trim() || undefined,
        status: status || undefined
      };
      const res = await quotationTemplateService.getTemplates(params);
      setTemplates(res.data.templates || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load quotation templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, status, role]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTemplates();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusToggle = async (t) => {
    if (!isAdmin) return;
    const nextStatus = t.status === "active" ? "inactive" : "active";
    try {
      await quotationTemplateService.updateStatus(t._id, nextStatus);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to deactivate / delete template "${name}"?`)) {
      return;
    }
    try {
      await quotationTemplateService.deleteTemplate(id);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete template");
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
          <h1 className="page-title">Quotation Templates</h1>
          <p className="page-subtitle">
            Configure and manage reusable quotation presets for products, variants and plans.
          </p>
        </div>

        {isAdmin && (
          <Link to="/templates/create" className="btn btn-primary">
            <Plus size={16} /> Create Template
          </Link>
        )}
      </div>

      {/* Filters */}
      <TemplateFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        showStatusFilter={isAdmin} // Staff only sees active by default
        onReset={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
      />

      {/* Error Message */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Code</th>
                <th>Template Name</th>
                <th style={{ width: "100px", textAlign: "center" }}>Items</th>
                <th style={{ width: "110px", textAlign: "center" }}>Validity</th>
                <th style={{ width: "150px", textAlign: "right" }}>Grand Total</th>
                <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                <th style={{ width: "130px" }}>Created</th>
                <th style={{ width: "160px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading templates from MongoDB...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    No quotation templates found. {isAdmin && "Click 'Create Template' above to get started."}
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t._id}>
                    {/* Code */}
                    <td style={{ fontWeight: 700, color: "#1e40af" }}>
                      <Link to={`/templates/${t._id}`}>{t.code}</Link>
                    </td>

                    {/* Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        <Link to={`/templates/${t._id}`}>{t.name}</Link>
                      </div>
                      {t.description && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.description}
                        </div>
                      )}
                    </td>

                    {/* Items count */}
                    <td style={{ textAlign: "center", fontWeight: 500 }}>
                      {t.items?.length || 0}
                    </td>

                    {/* Validity */}
                    <td style={{ textAlign: "center", color: "#475569" }}>
                      {t.validityDays} days
                    </td>

                    {/* Grand Total */}
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(t.grandTotal)}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: "center" }}>
                      <TemplateStatusBadge status={t.status} />
                    </td>

                    {/* Created Date */}
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        {/* View Details */}
                        <button
                          className="btn btn-outline btn-sm"
                          title="View Details"
                          onClick={() => navigate(`/templates/${t._id}`)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Quick Preview */}
                        <button
                          className="btn btn-outline btn-sm"
                          title="Preview Template"
                          onClick={() => setPreviewTemplate(t)}
                        >
                          Preview
                        </button>

                        {/* Admin-only edit & delete */}
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              title="Edit Template"
                              onClick={() => navigate(`/templates/${t._id}/edit`)}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              className="btn btn-outline btn-sm"
                              title={t.status === "active" ? "Deactivate Template" : "Activate Template"}
                              onClick={() => handleStatusToggle(t)}
                            >
                              <Power size={14} color={t.status === "active" ? "#b45309" : "#15803d"} />
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete Template"
                              onClick={() => handleDelete(t._id, t.name)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
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
              Showing {templates.length} of {pagination.total} templates
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, padding: "0 8px" }}>
                {page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
};

export default TemplateList;
