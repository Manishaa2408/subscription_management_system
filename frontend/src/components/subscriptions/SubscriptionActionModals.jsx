import React, { useState } from "react";
import { X, AlertCircle, RefreshCw, PauseCircle, PlayCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import subscriptionService from "../../services/subscriptionService";

// --- PAUSE MODAL ---
export const PauseModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [expectedResumeDate, setExpectedResumeDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for pausing the subscription.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await subscriptionService.pauseSubscription(subscription._id, reason, expectedResumeDate || null);
      onSuccess("Subscription paused successfully.");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to pause subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <PauseCircle size={20} color="#b45309" /> Pause Subscription
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "16px" }}>
          Pausing <strong>{subscription.subscriptionNumber}</strong> will temporarily halt recurring invoice generation in the M9 Billing Engine.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Reason for Pausing *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Customer requested temporary freeze during holidays"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">Expected Resume Date (Optional)</label>
            <input
              type="date"
              className="form-control"
              value={expectedResumeDate}
              onChange={(e) => setExpectedResumeDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#b45309", borderColor: "#b45309" }} disabled={submitting}>
              {submitting ? "Pausing..." : "Confirm Pause"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- RESUME MODAL ---
export const ResumeModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !subscription) return null;

  const handleResume = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await subscriptionService.resumeSubscription(subscription._id);
      onSuccess("Subscription resumed to Active status.");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to resume subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "440px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <PlayCircle size={20} color="#2563eb" /> Resume Subscription
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "#334155", marginBottom: "20px" }}>
          Are you sure you want to resume subscription <strong>{subscription.subscriptionNumber}</strong>?
          This will restore it to <strong>Active</strong> status and resume recurring billing in M9.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleResume} disabled={submitting}>
            {submitting ? "Resuming..." : "Confirm Resume"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CHANGE PLAN MODAL (UPGRADE / DOWNGRADE) ---
export const ChangePlanModal = ({ isOpen, onClose, subscription, plans = [], onSuccess }) => {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !subscription) return null;

  const currentPlan = subscription.lineItems?.[0]?.planSnapshot || {};
  const currentPrice = currentPlan.price || subscription.totalAmount || 0;

  const chosenPlan = plans.find((p) => p._id === selectedPlanId);
  const newPrice = chosenPlan ? (chosenPlan.price || chosenPlan.pricing?.monthly || 0) : null;
  const isUpgrade = newPrice !== null && newPrice >= currentPrice;
  const priceDiff = newPrice !== null ? newPrice - currentPrice : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError("Please select a new plan.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await subscriptionService.changePlan(subscription._id, selectedPlanId, reason);
      onSuccess(`Subscription successfully ${isUpgrade ? "upgraded" : "downgraded"}.`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to change subscription plan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={20} color="#7c3aed" /> Change Subscription Plan
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.875rem" }}>
          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Current Plan</div>
          <strong>{currentPlan.name || "Default Plan"}</strong>
          <div>₹{currentPrice.toLocaleString()} / {currentPlan.billingFrequency || "monthly"}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Select Target Plan *</label>
            <select
              className="form-control"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
            >
              <option value="">-- Choose New Plan --</option>
              {plans.map((p) => {
                const planPrice = p.price || p.pricing?.monthly || 0;
                return (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{planPrice.toLocaleString()} / {p.billingFrequency || "month"})
                  </option>
                );
              })}
            </select>
          </div>

          {chosenPlan && (
            <div
              style={{
                background: isUpgrade ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${isUpgrade ? "#86efac" : "#fde68a"}`,
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "14px",
                fontSize: "0.85rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: isUpgrade ? "#15803d" : "#b45309" }}>
                {isUpgrade ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                Detected: {isUpgrade ? "Plan Upgrade" : "Plan Downgrade"}
              </div>
              <div style={{ marginTop: "4px", color: "#334155" }}>
                New Price: <strong>₹{newPrice.toLocaleString()}</strong> | Adjustment:{" "}
                <strong>{priceDiff >= 0 ? `+₹${priceDiff.toLocaleString()}` : `-₹${Math.abs(priceDiff).toLocaleString()}`}</strong>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">Reason for Modification</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Customer requested upgrade to annual billing"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Applying..." : "Apply Plan Modification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- CANCEL MODAL ---
export const CancelModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelImmediately, setCancelImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setError("Please provide a reason for cancelling this subscription.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await subscriptionService.cancelSubscription(subscription._id, cancellationReason, cancelImmediately);
      onSuccess(`Subscription marked for ${cancelImmediately ? "immediate" : "end-of-period"} cancellation.`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to cancel subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c" }}>
            <XCircle size={20} color="#b91c1c" /> Cancel Subscription
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "16px" }}>
          Cancelling <strong>{subscription.subscriptionNumber}</strong> will stop all future recurring billing cycles in M9.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Cancellation Reason *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Customer migrated to on-premise infrastructure"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={cancelImmediately}
                onChange={(e) => setCancelImmediately(e.target.checked)}
              />
              <span><strong>Cancel Immediately</strong> (Uncheck to keep active until current period ends)</span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Keep Subscription
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- RENEW MODAL ---
export const RenewModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !subscription) return null;

  const handleRenew = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await subscriptionService.renewSubscription(subscription._id);
      onSuccess(res.message || "Subscription renewed successfully.");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to renew subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "460px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <RefreshCw size={20} color="#15803d" /> Renew Subscription Cycle
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <p style={{ fontSize: "0.875rem", color: "#334155", marginBottom: "16px" }}>
          Advance subscription <strong>{subscription.subscriptionNumber}</strong> to the next billing period.
        </p>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px", fontSize: "0.85rem" }}>
          <div>Current Period End: <strong>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</strong></div>
          <div style={{ marginTop: "4px" }}>Next Billing Date: <strong style={{ color: "#2563eb" }}>{subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : "N/A"}</strong></div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRenew} disabled={submitting}>
            {submitting ? "Renewing..." : "Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
};
