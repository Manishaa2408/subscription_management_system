import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import QuotationForm from "../../components/quotations/QuotationForm";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle } from "lucide-react";

export const CreateQuotation = () => {
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  if (isCustomer) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: "12px" }} />
        <h2>Access Denied</h2>
        <p style={{ color: "#64748b" }}>Customers cannot create quotations.</p>
      </div>
    );
  }

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      const res = await quotationService.createQuotation(formData);
      navigate(`/quotations/${res.data.quotation._id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to create quotation";
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
          <h1 className="page-title">Create Commercial Quotation</h1>
          <p className="page-subtitle">
            Prepare a new proposal with customer details, subscription tiers, discounts and validity duration.
          </p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <QuotationForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel="Create Draft Quotation"
      />
    </div>
  );
};

export default CreateQuotation;
