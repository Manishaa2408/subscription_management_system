import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  Eye, 
  ArrowRight,
  TrendingUp,
  PauseCircle,
  XCircle,
  ShieldCheck
} from "lucide-react";
import subscriptionService from "../../services/subscriptionService";
import SubscriptionStatusBadge from "../../components/subscriptions/SubscriptionStatusBadge";
import { 
  PauseModal, 
  ResumeModal, 
  ChangePlanModal, 
  CancelModal 
} from "../../components/subscriptions/SubscriptionActionModals";

export const CustomerSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Selected subscription for modal actions
  const [selectedSub, setSelectedSub] = useState(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const fetchCustomerSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, catRes] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getCatalogData().catch(() => ({ data: { plans: [] } }))
      ]);
      setSubscriptions(subRes.data?.subscriptions || []);
      setPlans(catRes.data?.plans || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load your subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerSubscriptions();
  }, []);

  const handleActionSuccess = (msg) => {
    setNotification({ type: "success", text: msg });
    fetchCustomerSubscriptions();
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <ShieldCheck size={20} color="#2563eb" />
            <h1 style={{ fontSize: "1.65rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Customer Portal – My Subscriptions
            </h1>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            View and manage your active SaaS licenses, renewal dates, and subscription plan options.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
          onClick={fetchCustomerSubscriptions}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "16px" }}>
          {notification.text}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Subscriptions Grid / List */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading your subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "40px", textAlign: "center", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <AlertCircle size={32} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ margin: "0 0 6px 0", color: "#334155" }}>No active subscriptions found</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
            You do not currently have any subscriptions assigned to your account.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link to="/portal/quotations" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              View Quotations <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {subscriptions.map((sub) => {
            const plan = sub.lineItems?.[0]?.planSnapshot || {};
            return (
              <div
                key={sub._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <Link to={`/subscriptions/${sub._id}`} style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2563eb" }}>
                        {sub.subscriptionNumber}
                      </Link>
                      <SubscriptionStatusBadge status={sub.status} />
                    </div>
                    <div style={{ color: "#334155", fontWeight: 600 }}>
                      {plan.name || "SaaS Plan"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                      ₹{(sub.totalAmount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "capitalize" }}>
                      Billed {sub.lineItems?.[0]?.billingFrequency || "monthly"}
                    </div>
                  </div>
                </div>

                {/* Dates Information Bar */}
                <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", fontSize: "0.85rem", marginBottom: "16px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Period Start</span>
                    <strong>{sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : "Pending"}</strong>
                  </div>

                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Current Period Ends</span>
                    <strong>{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "Pending"}</strong>
                  </div>

                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Next Renewal Date</span>
                    <strong style={{ color: "#2563eb" }}>
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : "None"}
                    </strong>
                  </div>

                  {sub.trialPeriod?.enabled && (
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Trial Period</span>
                      <strong style={{ color: "#4338ca" }}>
                        Active ({sub.trialPeriod.trialDays} Days)
                      </strong>
                    </div>
                  )}
                </div>

                {/* Self-service Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <Link to={`/subscriptions/${sub._id}`} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                    <Eye size={14} /> View Details & Timeline
                  </Link>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {["active", "trial"].includes(sub.status) && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsChangePlanOpen(true);
                        }}
                      >
                        <TrendingUp size={14} /> Upgrade / Change Plan
                      </button>
                    )}

                    {sub.status === "active" && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.85rem", color: "#b45309", borderColor: "#fde68a", display: "inline-flex", alignItems: "center", gap: "5px" }}
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsPauseOpen(true);
                        }}
                      >
                        <PauseCircle size={14} /> Pause
                      </button>
                    )}

                    {sub.status === "paused" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsResumeOpen(true);
                        }}
                      >
                        Resume
                      </button>
                    )}

                    {["active", "trial", "paused"].includes(sub.status) && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.85rem", color: "#b91c1c", borderColor: "#fca5a5", display: "inline-flex", alignItems: "center", gap: "5px" }}
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsCancelOpen(true);
                        }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modals */}
      {selectedSub && (
        <>
          <PauseModal
            isOpen={isPauseOpen}
            onClose={() => {
              setIsPauseOpen(false);
              setSelectedSub(null);
            }}
            subscription={selectedSub}
            onSuccess={handleActionSuccess}
          />

          <ResumeModal
            isOpen={isResumeOpen}
            onClose={() => {
              setIsResumeOpen(false);
              setSelectedSub(null);
            }}
            subscription={selectedSub}
            onSuccess={handleActionSuccess}
          />

          <ChangePlanModal
            isOpen={isChangePlanOpen}
            onClose={() => {
              setIsChangePlanOpen(false);
              setSelectedSub(null);
            }}
            subscription={selectedSub}
            plans={plans}
            onSuccess={handleActionSuccess}
          />

          <CancelModal
            isOpen={isCancelOpen}
            onClose={() => {
              setIsCancelOpen(false);
              setSelectedSub(null);
            }}
            subscription={selectedSub}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </div>
  );
};

export default CustomerSubscriptions;
