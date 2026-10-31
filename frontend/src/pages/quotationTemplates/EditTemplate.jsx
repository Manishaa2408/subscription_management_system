import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import TemplateForm from "../../components/quotationTemplates/TemplateForm";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle } from "lucide-react";

export const EditTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const res = await quotationTemplateService.getTemplateById(id);
        setTemplate(res.data.template);
      } catch (err) {
        console.error(err);
        setApiError(err.response?.data?.message || "Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (!isAdmin) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: "12px" }} />
        <h2>Access Denied</h2>
        <p style={{ color: "#64748b" }}>Only administrators can edit quotation templates.</p>
      </div>
    );
  }

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      await quotationTemplateService.updateTemplate(id, formData);
      navigate(`/templates/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update quotation template";
      const errList = err.response?.data?.errors || [];
      setApiError(errList.length > 0 ? `${msg}: ${errList.map(e => e.message || e).join(", ")}` : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: "48px" }}>Loading template details...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Quotation Template</h1>
          <p className="page-subtitle">
            Update line items, pricing snapshots, or validity duration for {template?.code}.
          </p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <TemplateForm
        initialData={template}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  );
};

export default EditTemplate;
