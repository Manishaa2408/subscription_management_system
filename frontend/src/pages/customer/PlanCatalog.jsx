import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const PlanCatalog = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await planService.getPlans({ status: "active" });
        setPlans(res.data?.plans || res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <Loading message="Loading subscription plans..." />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Brightloop Software Plans
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Choose the Right Plan for Your Business
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Flexible recurring billing, instant activation, and transparent pricing.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-4 mb-8 bg-red-50 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1 min-h-[40px]">
                  {plan.description || "Complete subscription access with Brightloop features."}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {plan.currency || "INR"} {plan.price?.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">
                    /{plan.billingFrequency || "month"}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Full platform access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Automated billing & invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Customer portal access
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/admin/quotations/create"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Request Quotation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanCatalog;
