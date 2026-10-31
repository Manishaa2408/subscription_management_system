import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { AlertCircle, ArrowLeft, Edit3, Tag, DollarSign, Calendar } from "lucide-react";

const PlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await planService.getPlan(id);
        setPlan(res.data);
      } catch (err) {
        setAlert({ type: "danger", message: err.response?.data?.message || err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  if (loading) return <Loading message="Loading plan details..." />;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/admin/plans")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Plans
          </button>
          {plan && (
            <Link
              to={`/admin/plans/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Plan
            </Link>
          )}
        </div>

        {alert && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{alert.message}</span>
          </div>
        )}

        {plan && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{plan.name}</h1>
                <p className="text-sm text-slate-500 mt-1">Code: {plan.code || id}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  plan.status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {plan.status || "active"}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</div>
                  <div className="text-lg font-bold text-slate-900">
                    {plan.currency || "INR"} {plan.price?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing Interval</div>
                  <div className="text-lg font-medium text-slate-800 capitalize">
                    Every {plan.billingInterval || 1} {plan.billingFrequency || "month"}(s)
                  </div>
                </div>
              </div>

              {plan.description && (
                <div className="md:col-span-2 flex items-start gap-3 pt-4 border-t border-slate-100">
                  <Tag className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</div>
                    <div className="text-slate-700 mt-1">{plan.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanDetails;
