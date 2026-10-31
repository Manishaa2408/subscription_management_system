// frontend/src/pages/admin/PlanCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { AlertCircle, X, Check } from "lucide-react";

const PlanCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    productId: "",
    billingFrequency: "monthly",
    billingInterval: 1,
    price: 0,
    currency: "INR",
    status: "active"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await planService.createPlan(form);
      setAlert({ type: "success", message: "Plan created successfully" });
      setTimeout(() => navigate("/admin/plans"), 1500);
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Create Subscription Plan</h1>
        {alert && (
          <div className={`alert alert-${alert.type}`}>\n            <AlertCircle size={18} className="mr-2" />
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-2 text-sm">
              <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-lg">
          {/* Simple fields – extend as needed */}
          <div>
            <label className="block font-medium">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium">Code</label>
            <input name="code" value={form.code} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium">Product ID</label>
            <input name="productId" value={form.productId} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium">Billing Frequency</label>
            <select name="billingFrequency" value={form.billingFrequency} onChange={handleChange} className="form-input">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Billing Interval</label>
            <input type="number" name="billingInterval" value={form.billingInterval} onChange={handleChange} className="form-input" min="1" />
          </div>
          <div>
            <label className="block font-medium">Price</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} className="form-input" min="0" step="0.01" />
          </div>
          <div>
            <label className="block font-medium">Currency</label>
            <input name="currency" value={form.currency} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="block font-medium">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="form-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loading message="Creating..." /> : <Check size={16} className="mr-1" />} Create
          </button>
        </form>
      </main>
    </div>
  );
};

export default PlanCreate;
