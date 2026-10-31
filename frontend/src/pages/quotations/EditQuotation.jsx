import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import QuotationForm from "../../components/quotations/QuotationForm";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const EditQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCustomer } = useAuth();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const res = await quotationService.getQuotationById(id);
        setQuotation(res.data.quotation);
      } catch (err) {
        console.error(err);
        setApiError(err.response?.data?.message || "Failed to load quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  if (isCustomer) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "#64748b" }}>Customers cannot edit quotations.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: "48px" }}>Loading quotation details...</div>;
  }

  if (quotation && quotation.status !== "draft") {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px" }}>
        <AlertCircle size={40} color="#d97706" style={{ marginBottom: "12px" }} />
        <h2>Quotation Locked</h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>
          Quotation <strong>{quotation.quotationNumber}</strong> has already been finalized ({quotation.status}). Only draft proposals can be edited.
        </p>
        <button className="btn btn-outline" onClick={() => navigate(`/quotations/${id}`)}>
          <ArrowLeft size={16} /> Back to Quotation Details
        </button>
      </div>
    );
  }

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      await quotationService.updateQuotation(id, formData);
      navigate(`/quotations/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update quotation";
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
          <h1 className="page-title">Edit Draft Quotation</h1>
          <p className="page-subtitle">
            Update line items, pricing, discounts or validity for {quotation?.quotationNumber}.
          </p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <QuotationForm
        initialData={quotation}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  );
};

export default EditQuotation;
