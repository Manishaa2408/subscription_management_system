// frontend/src/pages/customer/PlanCatalog.jsx
import React, { useEffect, useState } from "react";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { AlertCircle, X } from "lucide-react";

const PlanCatalog = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await planService.getCatalog();
        setPlans(res.data);
      } catch (err) {
        setAlert({ type: "danger", message: err.response?.data?.message || err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Subscription Plans Catalog</h1>
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <AlertCircle size={18} className="mr-2" />
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-2 text-sm"><X size={16} /></button>
          </div>
        )}
        {loading ? (
          <Loading message="Loading catalog..." />
        ) : (
          <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p._id} className="plan-card p-4 border rounded shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-2">{p.name}</h2>
                <p><strong>Code:</strong> {p.code}</p>
                <p><strong>Price:</strong> {p.currency} {p.price}</p>
                <p><strong>Billing:</strong> {p.billingFrequency} ({p.billingInterval})</p>
                <p><strong>Status:</strong> {p.status}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanCatalog;
