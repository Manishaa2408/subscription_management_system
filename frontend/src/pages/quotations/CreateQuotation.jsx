import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import quotationService from "../../services/quotationService";
import QuotationForm from "../../components/quotations/QuotationForm";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/common/PageHeader";
import { AlertCircle } from "lucide-react";

export const CreateQuotation = () => {
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  if (isCustomer) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500">Customers cannot create commercial quotations.</p>
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
    <div className="space-y-6">
      <PageHeader
        title="Create Commercial Quotation"
        subtitle="Prepare a new proposal with customer details, subscription tiers, discounts and validity duration."
      />

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {apiError}
        </div>
      )}

      <QuotationForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel="Create Draft Quotation"
      />
    </div>
  );
};

export default CreateQuotation;
