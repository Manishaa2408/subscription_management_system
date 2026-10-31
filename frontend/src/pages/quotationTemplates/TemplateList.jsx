import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import { useAuth } from "../../context/AuthContext";
import TemplateFilters from "../../components/quotationTemplates/TemplateFilters";
import TemplateStatusBadge from "../../components/quotationTemplates/TemplateStatusBadge";
import TemplatePreview from "../../components/quotationTemplates/TemplatePreview";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";
import { Plus, Eye, Edit2, Trash2, Power, AlertCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";

export const TemplateList = () => {
  const navigate = useNavigate();
  const { role, isAdmin, isCustomer } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  if (isCustomer) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500">
          Customer accounts cannot view or manage internal quotation templates. Please sign in with an Admin or Staff account.
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
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) {
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Quotation Templates"
        subtitle="Configure and manage reusable quotation presets for products, variants and subscription plans."
        action={
          isAdmin && (
            <Link
              to="/templates/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Template
            </Link>
          )
        }
      />

      {/* Filters */}
      <TemplateFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        showStatusFilter={isAdmin}
        onReset={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading templates..." />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No quotation templates found"
            description="Create reusable commercial proposal presets with standard products, tiers, and validity."
            actionText={isAdmin ? "Create Template" : undefined}
            onAction={isAdmin ? () => navigate("/templates/create") : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Template Name</th>
                  <th className="px-5 py-3.5 text-center">Items</th>
                  <th className="px-5 py-3.5 text-center">Validity</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-blue-600">
                      <Link to={`/templates/${t._id}`} className="hover:underline">
                        {t.code}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        <Link to={`/templates/${t._id}`} className="hover:text-blue-600">
                          {t.name}
                        </Link>
                      </div>
                      {t.description && (
                        <div className="text-xs text-slate-500 max-w-sm truncate mt-0.5">
                          {t.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center font-medium text-slate-700">
                      {t.items?.length || 0}
                    </td>

                    <td className="px-5 py-4 text-center text-xs text-slate-600">
                      {t.validityDays} days
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(t.grandTotal)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <TemplateStatusBadge status={t.status} />
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                          onClick={() => navigate(`/templates/${t._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Preview Template"
                          onClick={() => setPreviewTemplate(t)}
                        >
                          Preview
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Template"
                              onClick={() => navigate(`/templates/${t._id}/edit`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                              title={t.status === "active" ? "Deactivate Template" : "Activate Template"}
                              onClick={() => handleStatusToggle(t)}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Template"
                              onClick={() => handleDelete(t._id, t.name)}
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing {templates.length} of {pagination.total} templates
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

      {/* Quick Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};

export default TemplateList;
