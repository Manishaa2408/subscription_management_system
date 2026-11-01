// frontend/src/pages/customer/PlanCatalog.jsx
import React, { useEffect, useState } from "react";
import planService from "../../services/planService";
import { AlertCircle, Package, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PlanCatalog = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await planService.getCatalog();
        setPlans(res.data || []);
      } catch (err) {
        setAlert({ type: "danger", message: err.response?.data?.message || err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Available Subscription Plans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore plans available for your team and services.
          </p>
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

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading catalog...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No active plans available</h3>
          <p className="text-xs text-slate-500 mt-1">Please contact your account administrator or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center shadow-2xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{p.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{p.currency || 'INR'} {Number(p.price || 0).toLocaleString()}</span>
                  <span className="text-xs text-slate-500">/ {p.billingFrequency || 'month'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Billed every {p.billingInterval || 1} {p.billingFrequency || 'month'}(s)
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Available
                </span>
                <Link
                  to="/portal/quotations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Request Quote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanCatalog;
