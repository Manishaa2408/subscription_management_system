// frontend/src/pages/admin/PlanDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import planService from "../../services/planService";
import { AlertCircle, ArrowLeft, Package, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

const PlanDetails = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading plan details...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md mx-auto mb-4">
          Plan not found.
        </div>
        <Link
          to="/admin/products"
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-xs transition"
        >
          Return to Products & Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plans & Products</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{plan.name}</h1>
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {plan.code}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  plan.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${plan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {plan.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Product: <span className="font-medium text-slate-700">{plan.productId?.name || plan.productId}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {alert && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-current opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Plan Configuration</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Billing Frequency</dt>
              <dd className="font-semibold text-slate-800 mt-1 capitalize">{plan.billingFrequency} ({plan.billingInterval})</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Price / Interval</dt>
              <dd className="font-bold text-slate-900 text-base mt-0.5">{plan.currency} {Number(plan.price || 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Trial Period</dt>
              <dd className="font-semibold text-slate-800 mt-1">{plan.trialPeriodDays ? `${plan.trialPeriodDays} Days` : 'No Trial'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Status</dt>
              <dd className="font-semibold text-slate-800 mt-1 capitalize">{plan.status || 'Active'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/admin/products"
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <span>Manage Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;
