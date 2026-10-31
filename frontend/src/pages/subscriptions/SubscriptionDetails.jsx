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
  Mail,
  IndianRupee,
  ShieldCheck
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
import { LoadingState } from "../../components/common/LoadingState";
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
    return <LoadingState message="Loading subscription details..." />;
  }

  if (error || !subscription) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Error Loading Subscription</h2>
        <p className="text-sm text-slate-500 mb-4">{error || "Subscription not found."}</p>
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subscriptions
        </Link>
      </div>
    );
  }

  const isStaffOrAdmin = role === "admin" || role === "staff";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscriptions
        </Link>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-sm font-medium ${notification.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {notification.text}
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-mono text-slate-900">
                {subscription.subscriptionNumber}
              </h1>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">{subscription.customerSnapshot?.name}</strong>
                {subscription.customerSnapshot?.companyName && ` (${subscription.customerSnapshot.companyName})`}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {subscription.customerSnapshot?.email}
              </span>
              {subscription.quotationSnapshot?.quotationNumber && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Proposal {subscription.quotationSnapshot.quotationNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {subscription.status === "pending" && isStaffOrAdmin && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
                onClick={handleActivate}
                disabled={activating}
              >
                <CheckCircle className="w-3.5 h-3.5" /> {activating ? "Activating..." : "Activate Subscription"}
              </button>
            )}

            {subscription.status === "active" && (
              <>
                {isStaffOrAdmin && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
                    onClick={() => setIsRenewOpen(true)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Renew Cycle
                  </button>
                )}

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
                  onClick={() => setIsChangePlanOpen(true)}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Change Plan
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold rounded-xl transition"
                  onClick={() => setIsPauseOpen(true)}
                >
                  <PauseCircle className="w-3.5 h-3.5" /> Pause
                </button>
              </>
            )}

            {subscription.status === "paused" && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                onClick={() => setIsResumeOpen(true)}
              >
                <PlayCircle className="w-3.5 h-3.5" /> Resume Subscription
              </button>
            )}

            {subscription.status === "trial" && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
                onClick={() => setIsChangePlanOpen(true)}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Upgrade Plan
              </button>
            )}

            {["active", "trial", "paused", "past_due"].includes(subscription.status) && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold rounded-xl transition"
                onClick={() => setIsCancelOpen(true)}
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Notices */}
        {subscription.cancellation?.status === "scheduled" && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Scheduled Cancellation:</strong> This subscription will cancel at period end ({new Date(subscription.cancellation.effectiveDate).toLocaleDateString()}). Reason: "{subscription.cancellation.reason}"
            </span>
          </div>
        )}

        {subscription.status === "paused" && subscription.pauseHistory?.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 mt-4">
            <PauseCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Subscription Paused:</strong> Reason: "{subscription.pauseHistory[subscription.pauseHistory.length - 1].reason}".
              {subscription.pauseHistory[subscription.pauseHistory.length - 1].expectedResumeDate && ` Expected resume: ${new Date(subscription.pauseHistory[subscription.pauseHistory.length - 1].expectedResumeDate).toLocaleDateString()}`}
            </span>
          </div>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: "overview", label: "Overview & Items" },
          { id: "renewals", label: `Renewal Cycles (${renewals.length})` },
          { id: "plans", label: `Plan Changes (${planChanges.length})` },
          { id: "activity", label: `Audit Trail (${activities.length})` }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 -mb-px ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Items */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <BillingInformationCard subscription={subscription} onSyncUpdated={loadSubscription} />

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Subscribed Products & Plans
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Item / Plan</th>
                    <th className="px-4 py-3">Billing Frequency</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscription.lineItems?.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <strong className="text-slate-900 font-semibold">{item.planSnapshot?.name || item.description}</strong>
                        {item.description && item.description !== item.planSnapshot?.name && (
                          <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                        Every {item.billingInterval || 1} {item.billingFrequency || "Month"}(s)
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right text-slate-700">₹{(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                        ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <div className="text-right">
                <span className="text-xs text-slate-500">Recurring Contract Value</span>
                <div className="text-xl font-bold text-blue-600">
                  ₹{(subscription.totalAmount || 0).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-400">{subscription.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Renewal History */}
      {activeTab === "renewals" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Renewal History & Period Cycles
          </h3>
          <SubscriptionRenewalHistory renewals={renewals} />
        </div>
      )}

      {/* Tab 3: Plan Changes */}
      {activeTab === "plans" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Plan Upgrades & Downgrades History
          </h3>
          <SubscriptionPlanChangeHistory planChanges={planChanges} />
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
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
