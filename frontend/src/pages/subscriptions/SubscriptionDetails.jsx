import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  PauseCircle, 
  PlayCircle, 
  TrendingUp, 
  XCircle, 
  Calendar, 
  Layers, 
  FileText,
  Clock,
  AlertCircle,
  Building,
  Mail
} from "lucide-react";
import subscriptionService from "../../services/subscriptionService";
import SubscriptionStatusBadge from "../../components/subscriptions/SubscriptionStatusBadge";
import SubscriptionTimeline from "../../components/subscriptions/SubscriptionTimeline";
import BillingInformationCard from "../../components/subscriptions/BillingInformationCard";
import SubscriptionRenewalHistory from "../../components/subscriptions/SubscriptionRenewalHistory";
import SubscriptionPlanChangeHistory from "../../components/subscriptions/SubscriptionPlanChangeHistory";
import { 
  PauseModal, 
  ResumeModal, 
  ChangePlanModal, 
  CancelModal, 
  RenewModal 
} from "../../components/subscriptions/SubscriptionActionModals";
import { useAuth } from "../../context/AuthContext";

export const SubscriptionDetails = () => {
  const { id } = useParams();
  const { role } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [activities, setActivities] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [planChanges, setPlanChanges] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Tab state: "overview", "renewals", "plans", "activity"
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, actRes, renRes, pcRes, catRes] = await Promise.all([
        subscriptionService.getSubscriptionById(id),
        subscriptionService.getActivity(id),
        subscriptionService.getRenewals(id),
        subscriptionService.getPlanChanges(id),
        subscriptionService.getCatalogData().catch(() => ({ data: { plans: [] } }))
      ]);

      setSubscription(subRes.data?.subscription || null);
      setActivities(actRes.data?.activity || []);
      setRenewals(renRes.data?.renewals || []);
      setPlanChanges(pcRes.data?.planChanges || []);
      setPlans(catRes.data?.plans || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [id]);

  const handleActionSuccess = (msg) => {
    setNotification({ type: "success", text: msg });
    loadSubscription();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleActivate = async () => {
    try {
      setActivating(true);
      const res = await subscriptionService.activateSubscription(subscription._id);
      handleActionSuccess(res.message || "Subscription activated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Activation failed.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px", textAlign: "center", color: "#64748b" }}>
        <RefreshCw size={28} className="spin" style={{ margin: "0 auto 12px auto" }} />
        <p>Loading subscription details...</p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
        <div className="alert alert-error">{error || "Subscription not found."}</div>
        <Link to="/subscriptions" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <ArrowLeft size={16} /> Back to Subscriptions
        </Link>
      </div>
    );
  }

  const isStaffOrAdmin = role === "admin" || role === "staff";

  return (
    <div className="page-container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: "16px" }}>
        <Link to="/subscriptions" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Subscriptions
        </Link>
      </div>

      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "16px" }}>
          {notification.text}
        </div>
      )}

      {/* Main Header Card */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {subscription.subscriptionNumber}
              </h1>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#64748b", fontSize: "0.875rem", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Building size={15} /> <strong>{subscription.customerSnapshot?.name}</strong>
                {subscription.customerSnapshot?.companyName && ` (${subscription.customerSnapshot.companyName})`}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Mail size={15} /> {subscription.customerSnapshot?.email}
              </span>
              {subscription.quotationSnapshot?.quotationNumber && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FileText size={15} /> Derived from proposal <strong>{subscription.quotationSnapshot.quotationNumber}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Pending activation */}
            {subscription.status === "pending" && isStaffOrAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={handleActivate}
                disabled={activating}
              >
                <CheckCircle size={15} /> {activating ? "Activating..." : "Activate Subscription"}
              </button>
            )}

            {/* Active Actions */}
            {subscription.status === "active" && (
              <>
                {isStaffOrAdmin && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setIsRenewOpen(true)}
                  >
                    <RefreshCw size={15} /> Renew Cycle
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setIsChangePlanOpen(true)}
                >
                  <TrendingUp size={15} /> Change Plan
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", borderColor: "#fde68a" }}
                  onClick={() => setIsPauseOpen(true)}
                >
                  <PauseCircle size={15} /> Pause
                </button>
              </>
            )}

            {/* Paused Actions */}
            {subscription.status === "paused" && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setIsResumeOpen(true)}
              >
                <PlayCircle size={15} /> Resume Subscription
              </button>
            )}

            {/* Trial Actions */}
            {subscription.status === "trial" && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setIsChangePlanOpen(true)}
              >
                <TrendingUp size={15} /> Upgrade Plan
              </button>
            )}

            {/* Cancellation (available on active, trial, paused, past_due) */}
            {["active", "trial", "paused", "past_due"].includes(subscription.status) && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b91c1c", borderColor: "#fca5a5" }}
                onClick={() => setIsCancelOpen(true)}
              >
                <XCircle size={15} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Cancellation Notice if marked */}
        {subscription.cancellation?.status === "scheduled" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "10px 14px", fontSize: "0.85rem", color: "#b45309", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>
              <strong>Scheduled Cancellation:</strong> This subscription will cancel at the end of the current period ({new Date(subscription.cancellation.effectiveDate).toLocaleDateString()}). Reason: "{subscription.cancellation.reason}"
            </span>
          </div>
        )}

        {/* Pause Notice if paused */}
        {subscription.status === "paused" && subscription.pauseHistory?.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "10px 14px", fontSize: "0.85rem", color: "#b45309", display: "flex", alignItems: "center", gap: "8px" }}>
            <PauseCircle size={16} />
            <span>
              <strong>Subscription Paused:</strong> Reason: "{subscription.pauseHistory[subscription.pauseHistory.length - 1].reason}".
              {subscription.pauseHistory[subscription.pauseHistory.length - 1].expectedResumeDate && ` Expected resume: ${new Date(subscription.pauseHistory[subscription.pauseHistory.length - 1].expectedResumeDate).toLocaleDateString()}`}
            </span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "overview" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "overview" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Overview & Items
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("renewals")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "renewals" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "renewals" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          Renewal Cycles ({renewals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "plans" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "plans" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          Plan Modifications ({planChanges.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "activity" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "activity" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          Lifecycle Audit Trail ({activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ITEMS */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {/* M9 Billing Information Card */}
          <BillingInformationCard subscription={subscription} onSyncUpdated={loadSubscription} />

          {/* Line Items Table */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
              Subscribed Products & Plans
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table className="items-table" style={{ width: "100%", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Item / Plan</th>
                    <th>Billing Frequency</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {subscription.lineItems?.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td>
                        <strong>{item.planSnapshot?.name || item.description}</strong>
                        {item.description && item.description !== item.planSnapshot?.name && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.description}</div>
                        )}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        Every {item.billingInterval || 1} {item.billingFrequency || "Month"}(s)
                      </td>
                      <td>{item.quantity}</td>
                      <td>₹{(item.unitPrice || 0).toLocaleString()}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "14px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Recurring Contract Value</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2563eb" }}>
                  ₹{(subscription.totalAmount || 0).toLocaleString()} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>{subscription.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RENEWAL HISTORY */}
      {activeTab === "renewals" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
            Renewal History & Period Cycles
          </h3>
          <SubscriptionRenewalHistory renewals={renewals} />
        </div>
      )}

      {/* TAB 3: PLAN MODIFICATIONS */}
      {activeTab === "plans" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
            Plan Upgrades & Downgrades History
          </h3>
          <SubscriptionPlanChangeHistory planChanges={planChanges} />
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === "activity" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 14px 0" }}>
            Lifecycle Activity & State Machine Log
          </h3>
          <SubscriptionTimeline activities={activities} />
        </div>
      )}

      {/* Modals */}
      <PauseModal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        subscription={subscription}
        onSuccess={handleActionSuccess}
      />

      <ResumeModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
        subscription={subscription}
        onSuccess={handleActionSuccess}
      />

      <ChangePlanModal
        isOpen={isChangePlanOpen}
        onClose={() => setIsChangePlanOpen(false)}
        subscription={subscription}
        plans={plans}
        onSuccess={handleActionSuccess}
      />

      <CancelModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        subscription={subscription}
        onSuccess={handleActionSuccess}
      />

      <RenewModal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        subscription={subscription}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

export default SubscriptionDetails;
