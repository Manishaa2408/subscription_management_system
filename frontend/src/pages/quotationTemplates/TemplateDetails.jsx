import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import { useAuth } from "../../context/AuthContext";
import TemplateStatusBadge from "../../components/quotationTemplates/TemplateStatusBadge";
import TemplateItemTable from "../../components/quotationTemplates/TemplateItemTable";
import TemplatePreview from "../../components/quotationTemplates/TemplatePreview";
import { ArrowLeft, Edit2, Eye, Power, Trash2, Calendar, Clock, CheckCircle } from "lucide-react";

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
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "#64748b" }}>Customers cannot view internal quotation templates.</p>
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
    if (!window.confirm(`Are you sure you want to deactivate / delete "${template.name}"?`)) {
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
    return <div className="card" style={{ textAlign: "center", padding: "48px" }}>Loading template details...</div>;
  }

  if (error || !template) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>Error Loading Template</h2>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>{error || "Template not found"}</p>
        <Link to="/templates" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Templates
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Navigation & Action Buttons */}
      <div className="page-header">
        <div>
          <Link
            to="/templates"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Back to Templates
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 className="page-title">{template.name}</h1>
            <TemplateStatusBadge status={template.status} />
          </div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}>
            Template Code: <strong style={{ color: "#1e40af" }}>{template.code}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={() => setShowPreview(true)}>
            <Eye size={16} /> Preview Template
          </button>

          {isAdmin && (
            <>
              <button className="btn btn-outline" onClick={handleStatusToggle}>
                <Power size={16} color={template.status === "active" ? "#b45309" : "#15803d"} />
                {template.status === "active" ? "Deactivate" : "Activate"}
              </button>

              <Link to={`/templates/${template._id}/edit`} className="btn btn-primary">
                <Edit2 size={16} /> Edit Template
              </Link>

              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Default Quotation Validity
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
            {template.validityDays} Days
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Used by M6 to compute customer quotation expiration.
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Configured Items
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
            {template.items?.length || 0} Line Items
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Products, service variants and subscription plans.
          </div>
        </div>

        <div className="card" style={{ margin: 0, background: "#f8fafc" }}>
          <div style={{ fontSize: "0.8rem", color: "#1e40af", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
            Template Grand Total
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e40af" }}>
            {formatCurrency(template.grandTotal)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Subtotal: {formatCurrency(template.subtotal)} + Tax: {formatCurrency(template.taxTotal)}
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      {(template.description || template.notes) && (
        <div className="card">
          {template.description && (
            <div style={{ marginBottom: template.notes ? "16px" : 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Description
              </div>
              <p style={{ color: "#1e293b", fontSize: "0.95rem" }}>{template.description}</p>
            </div>
          )}
          {template.notes && (
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Internal Notes / Terms
              </div>
              <p style={{ color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>{template.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Line Items Table */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>
          Configured Products & Plans
        </h2>
        <TemplateItemTable items={template.items} readOnly={true} />
      </div>

      {/* Timestamps audit card */}
      <div className="card" style={{ fontSize: "0.85rem", color: "#64748b", background: "#f8fafc" }}>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div>Created: {new Date(template.createdAt).toLocaleString()}</div>
          <div>Last Updated: {new Date(template.updatedAt).toLocaleString()}</div>
          <div>System ID: <code>{template._id}</code></div>
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
