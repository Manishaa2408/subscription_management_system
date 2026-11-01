// frontend/src/pages/admin/PlanDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { AlertCircle, X } from "lucide-react";

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

  if (loading) return <Loading message="Loading plan..." />;

  if (!plan) return <div className="app-container"><Navbar /><p>No plan found.</p></div>;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Plan Details</h1>
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <AlertCircle size={18} className="mr-2" />
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-2 text-sm"><X size={16} /></button>
          </div>
        )}
        <div className="plan-details mt-4">
          <p><strong>Name:</strong> {plan.name}</p>
          <p><strong>Code:</strong> {plan.code}</p>
          <p><strong>Product:</strong> {plan.productId?.name || plan.productId}</p>
          <p><strong>Billing:</strong> {plan.billingFrequency} ({plan.billingInterval})</p>
          <p><strong>Price:</strong> {plan.currency} {plan.price}</p>
          <p><strong>Status:</strong> {plan.status}</p>
          {/* Add more fields as needed */}
        </div>
      </main>
    </div>
  );
};

export default PlanDetails;
