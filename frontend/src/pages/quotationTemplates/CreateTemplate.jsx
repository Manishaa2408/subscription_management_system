import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import quotationTemplateService from "../../services/quotationTemplateService";
import TemplateForm from "../../components/quotationTemplates/TemplateForm";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle } from "lucide-react";

export const CreateTemplate = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  if (!isAdmin) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: "12px" }} />
        <h2>Access Denied</h2>
        <p style={{ color: "#64748b" }}>Only administrators can create quotation templates.</p>
      </div>
    );
  }

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      const res = await quotationTemplateService.createTemplate(formData);
      navigate(`/templates/${res.data.template._id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to create quotation template";
      const errList = err.response?.data?.errors || [];
      setApiError(errList.length > 0 ? `${msg}: ${errList.map(e => e.message || e).join(", ")}` : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Quotation Template</h1>
          <p className="page-subtitle">
            Configure line items, quantities, pricing snapshots and validity duration.
          </p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <TemplateForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel="Create Template"
      />
    </div>
  );
};

export default CreateTemplate;
