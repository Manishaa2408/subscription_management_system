// frontend/src/pages/admin/PlanDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import planService from "../../services/planService";
import Navbar from "../../components/common/Navbar";
import Loading from "../../components/common/Loading";
import { AlertCircle, X, Eye, Edit2, Archive, Check, XCircle } from "lucide-react";

const PlanDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await planService.listPlans({ page: pagination.page, limit: pagination.limit });
      if (res && res.data) {
        setPlans(res.data.plans || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [pagination.page]);

  const toggleStatus = async (plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    if (!window.confirm(`Change status of ${plan.name} to ${newStatus}?`)) return;
    try {
      await planService.changePlanStatus(plan._id, newStatus);
      setAlert({ type: "success", message: "Status updated" });
      fetchPlans();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.message || err.message });
    }
  };

  const archive = async (plan) => {
    if (!window.confirm(`Archive plan ${plan.name}? This cannot be undone.`)) return;
    try {
      await planService.archivePlan(plan._id);
      setAlert({ type: "success", message: "Plan archived" });
      fetchPlans();
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="page-header flex items-center justify-between">
          <h1 className="page-title">Subscription Plans</h1>
          <Link to="/admin/plans/create" className="btn btn-primary">
            <Check size={16} className="mr-1" /> Create Plan
          </Link>
        </div>
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <AlertCircle size={18} className="mr-2" />
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-2 text-sm">
              <X size={16} />
            </button>
          </div>
        )}
        {loading ? (
          <Loading message="Loading plans..." />
        ) : (
          <>
            <table className="data-table mt-4 w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Billing</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.code}</td>
                    <td>{p.productId?.name || p.productId}</td>
                    <td>{p.billingFrequency} ({p.billingInterval})</td>
                    <td>{p.currency} {p.price}</td>
                    <td>
                      <span className={
                        p.status === "active"
                          ? "badge-active"
                          : p.status === "inactive"
                          ? "badge-inactive"
                          : "badge-archived"
                      }>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="inline-flex gap-2">
                        <Link to={`/admin/plans/${p._id}`} className="btn btn-secondary btn-sm">
                          <Eye size={14} /> View
                        </Link>
                        <Link to={`/admin/plans/${p._id}/edit`} className="btn btn-secondary btn-sm">
                          <Edit2 size={14} /> Edit
                        </Link>
                        <button onClick={() => toggleStatus(p)} className="btn btn-secondary btn-sm">
                          {p.status === "active" ? <XCircle size={14} /> : <Check size={14} />}
                          {p.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        {p.status !== "archived" && (
                          <button onClick={() => archive(p)} className="btn btn-danger btn-sm">
                            <Archive size={14} /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="inline-flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PlanDashboard;
