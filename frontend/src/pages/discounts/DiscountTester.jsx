import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import discountService from "../../services/discountService";
import DiscountValidationPreview from "../../components/discounts/DiscountValidationPreview";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingState } from "../../components/common/LoadingState";

export const DiscountTester = () => {
  const [catalog, setCatalog] = useState({ customers: [], plans: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const res = await discountService.getCatalogData();
        setCatalog(res.data || { customers: [], plans: [] });
      } catch (err) {
        console.error("Failed to load catalog for tester", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/discounts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discounts
        </Link>
        <PageHeader
          title="Coupon & Pricing Rule Validator"
          subtitle="Interactive tester to simulate cart checkouts, verify customer eligibility rules, and test discount caps before publishing."
        />
      </div>

      {loading ? (
        <LoadingState message="Loading tester environment..." />
      ) : (
        <DiscountValidationPreview
          initialCode="WELCOME20"
          customers={catalog.customers}
          plans={catalog.plans}
        />
      )}
    </div>
  );
};

export default DiscountTester;
