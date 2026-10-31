import React, { useState } from "react";
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import subscriptionService from "../../services/subscriptionService";

export const BillingInformationCard = ({ subscription, onSyncUpdated }) => {
  const [retrying, setRetrying] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  if (!subscription) return null;

  const handleRetrySync = async () => {
    try {
      setRetrying(true);
      setSyncMsg(null);
      const res = await subscriptionService.retryBillingSync(subscription._id);
      setSyncMsg({ type: "success", text: res.message || "Billing schedule synced successfully" });
      if (onSyncUpdated) onSyncUpdated();
    } catch (err) {
      setSyncMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to sync billing schedule"
      });
    } finally {
      setRetrying(false);
    }
  };

  const syncStatus = subscription.billingIntegration?.status || "pending";
  const primaryItem = subscription.lineItems?.[0] || {};

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <Calendar size={18} color="#2563eb" /> Billing & Engine Schedule
        </h3>

        {/* Sync Status Badge */}
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "4px",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            backgroundColor:
              syncStatus === "registered" ? "#dcfce7" :
              syncStatus === "failed" ? "#fee2e2" :
              syncStatus === "suspended" ? "#fef3c7" : "#f1f5f9",
            color:
              syncStatus === "registered" ? "#15803d" :
              syncStatus === "failed" ? "#b91c1c" :
              syncStatus === "suspended" ? "#b45309" : "#475569",
            border: "1px solid currentColor"
          }}
        >
          {syncStatus === "registered" && <CheckCircle size={13} />}
          {syncStatus === "failed" && <AlertTriangle size={13} />}
          M9: {syncStatus}
        </span>
      </div>

      {syncMsg && (
        <div className={`alert ${syncMsg.type === "success" ? "alert-success" : "alert-error"}`} style={{ fontSize: "0.8rem", padding: "8px 12px" }}>
          {syncMsg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "0.875rem" }}>
        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Billing Cycle</span>
          <strong style={{ textTransform: "capitalize" }}>
            Every {primaryItem.billingInterval || 1} {primaryItem.billingFrequency || "Month"}(s)
          </strong>
        </div>

        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Current Period Start</span>
          <strong>
            {subscription.currentPeriodStart
              ? new Date(subscription.currentPeriodStart).toLocaleDateString()
              : "Not activated"}
          </strong>
        </div>

        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Current Period End</span>
          <strong>
            {subscription.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
              : "Not activated"}
          </strong>
        </div>

        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Next Billing Date</span>
          <strong style={{ color: "#2563eb" }}>
            {subscription.nextBillingDate
              ? new Date(subscription.nextBillingDate).toLocaleDateString()
              : "None"}
          </strong>
        </div>

        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Trial Period</span>
          <span>
            {subscription.trialPeriod?.enabled ? (
              <span style={{ color: "#4338ca", fontWeight: 600 }}>
                {subscription.trialPeriod.trialDays} Days (Ends {new Date(subscription.trialPeriod.trialEndDate).toLocaleDateString()})
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>No trial enabled</span>
            )}
          </span>
        </div>

        <div>
          <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Schedule Reference</span>
          <code>{subscription.billingIntegration?.externalScheduleId || "None"}</code>
        </div>
      </div>

      {/* Sync Failure or Warning */}
      {subscription.billingIntegration?.lastError && (
        <div style={{ marginTop: "14px", padding: "10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "0.8rem", color: "#b91c1c" }}>
          <strong>Sync Error:</strong> {subscription.billingIntegration.lastError}
        </div>
      )}

      {/* Retry Sync Button */}
      {(syncStatus === "failed" || !subscription.billingIntegration?.externalScheduleId) && (
        <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={handleRetrySync}
            disabled={retrying}
          >
            <RefreshCw size={14} className={retrying ? "spin" : ""} />
            {retrying ? "Syncing with Engine..." : "Retry M9 Registration"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BillingInformationCard;
