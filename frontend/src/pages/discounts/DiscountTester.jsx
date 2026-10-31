import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import discountService from "../../services/discountService";
import DiscountValidationPreview from "../../components/discounts/DiscountValidationPreview";

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
    <div className="page-container" style={{ maxWidth: "860px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/discounts" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.85rem", marginBottom: "8px" }}>
          <ArrowLeft size={16} /> Back to Discounts
        </Link>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
          Standalone Coupon & Rule Validator
        </h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
          Interactive playground to simulate quotation carts, verify eligibility rules, and test discount caps before publishing offers to customers.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading tester environment...</p>
        </div>
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
