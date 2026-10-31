import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import { useAuth } from "../../context/AuthContext";
import TemplateStatusBadge from "../../components/quotationTemplates/TemplateStatusBadge";
import TemplateItemTable from "../../components/quotationTemplates/TemplateItemTable";
import TemplatePreview from "../../components/quotationTemplates/TemplatePreview";
import { LoadingState } from "../../components/common/LoadingState";
import { ArrowLeft, Edit2, Eye, Power, Trash2, Calendar, Clock, CheckCircle, Package, IndianRupee } from "lucide-react";

export const TemplateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isCustomer } = useAuth();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  if (isCustomer) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500">Customers cannot view internal quotation templates.</p>
      </div>
    );
  }

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quotationTemplateService.getTemplateById(id);
      setTemplate(res.data.template);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load quotation template details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!isAdmin || !template) return;
    const nextStatus = template.status === "active" ? "inactive" : "active";
    try {
      await quotationTemplateService.updateStatus(template._id, nextStatus);
      fetchTemplate();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !template) return;
    if (!window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }
    try {
      await quotationTemplateService.deleteTemplate(template._id);
      navigate("/templates");
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

  if (loading) {
    return <LoadingState message="Loading template details..." />;
  }

  if (error || !template) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Error Loading Template</h2>
        <p className="text-sm text-slate-500 mb-4">{error || "Template not found"}</p>
        <Link
          to="/templates"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/templates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Templates
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
            <TemplateStatusBadge status={template.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Template Code: <span className="font-mono font-semibold text-blue-600">{template.code}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Eye className="w-4 h-4 text-slate-400" /> Preview Template
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleStatusToggle}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Power className={`w-4 h-4 ${template.status === "active" ? "text-amber-500" : "text-emerald-500"}`} />
                {template.status === "active" ? "Deactivate" : "Activate"}
              </button>

              <Link
                to={`/templates/${template._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Edit2 className="w-4 h-4" /> Edit Template
              </Link>

              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Clock className="w-3.5 h-3.5" /> Proposal Validity
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {template.validityDays} Days
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Standard customer decision window before expiration.
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Package className="w-3.5 h-3.5" /> Package Content
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {template.items?.length || 0} Line Items
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Products, service tiers, and configured plan add-ons.
          </div>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <IndianRupee className="w-3.5 h-3.5" /> Template Grand Total
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {formatCurrency(template.grandTotal)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Subtotal: {formatCurrency(template.subtotal)} • Tax: {formatCurrency(template.taxTotal)}
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      {(template.description || template.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.description && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Description
              </span>
              <p className="text-sm text-slate-700">{template.description}</p>
            </div>
          )}
          {template.notes && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Internal Sales Terms
              </span>
              <p className="text-sm text-slate-600 italic">{template.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Configured Products & Plans</h2>
        <TemplateItemTable items={template.items} readOnly={true} />
      </div>

      {/* Metadata Audit Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 flex flex-wrap gap-6 items-center">
        <div>Created: {new Date(template.createdAt).toLocaleString()}</div>
        <div>Last Updated: {new Date(template.updatedAt).toLocaleString()}</div>
        <div>
          Template ID: <span className="font-mono text-slate-700">{template._id}</span>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreview template={template} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default TemplateDetails;
