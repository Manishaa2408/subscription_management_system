/**
 * Billing Adapter for Subscription Lifecycle Management (M7)
 * Interfaces with Module M9 (Recurring Billing & Invoice Generation Engine)
 * Manages recurring schedule registration, pause, resumption, and cancellation without duplicating billing execution.
 */

// In-memory registry of active billing schedules in M9
const externalSchedules = new Map();

export const registerSubscription = async (subscriptionSnapshot) => {
  const scheduleId = `SCHED-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const scheduleRecord = {
    externalScheduleId: scheduleId,
    subscriptionId: subscriptionSnapshot._id || subscriptionSnapshot.id,
    subscriptionNumber: subscriptionSnapshot.subscriptionNumber,
    customerId: subscriptionSnapshot.customerId,
    nextBillingDate: subscriptionSnapshot.nextBillingDate,
    billingFrequency: subscriptionSnapshot.lineItems?.[0]?.billingFrequency || "monthly",
    status: "active",
    registeredAt: new Date(),
    lastSyncAt: new Date()
  };

  externalSchedules.set(String(scheduleRecord.subscriptionId), scheduleRecord);

  console.log(`[M9 Billing Engine] Registered recurring billing schedule: ${scheduleId} for Subscription ${subscriptionSnapshot.subscriptionNumber}`);

  return {
    success: true,
    externalScheduleId: scheduleId,
    status: "registered",
    lastSyncAt: new Date()
  };
};

export const updateBillingSchedule = async (subscriptionId, changes = {}) => {
  const strId = String(subscriptionId);
  const existing = externalSchedules.get(strId);

  if (existing) {
    Object.assign(existing, changes, { lastSyncAt: new Date() });
    externalSchedules.set(strId, existing);
  }

  console.log(`[M9 Billing Engine] Updated recurring schedule for Subscription ${strId}:`, changes);

  return {
    success: true,
    status: "registered",
    lastSyncAt: new Date()
  };
};

export const pauseBillingSchedule = async (subscriptionId, reason = "") => {
  const strId = String(subscriptionId);
  const existing = externalSchedules.get(strId);

  if (existing) {
    existing.status = "paused";
    existing.pauseReason = reason;
    existing.lastSyncAt = new Date();
    externalSchedules.set(strId, existing);
  }

  console.log(`[M9 Billing Engine] Suspended recurring schedule for Subscription ${strId}. Reason: ${reason}`);

  return {
    success: true,
    status: "paused",
    lastSyncAt: new Date()
  };
};

export const resumeBillingSchedule = async (subscriptionId, billingDetails = {}) => {
  const strId = String(subscriptionId);
  const existing = externalSchedules.get(strId);

  if (existing) {
    existing.status = "active";
    Object.assign(existing, billingDetails, { lastSyncAt: new Date() });
    externalSchedules.set(strId, existing);
  }

  console.log(`[M9 Billing Engine] Reactivated recurring schedule for Subscription ${strId}`);

  return {
    success: true,
    status: "registered",
    lastSyncAt: new Date()
  };
};

export const cancelBillingSchedule = async (subscriptionId, effectiveDate = null) => {
  const strId = String(subscriptionId);
  const existing = externalSchedules.get(strId);

  if (existing) {
    existing.status = "cancelled";
    existing.effectiveCancellationDate = effectiveDate || new Date();
    existing.lastSyncAt = new Date();
    externalSchedules.set(strId, existing);
  }

  console.log(`[M9 Billing Engine] Cancelled recurring schedule for Subscription ${strId}`);

  return {
    success: true,
    status: "cancelled",
    lastSyncAt: new Date()
  };
};

export const getBillingSchedule = async (subscriptionId) => {
  return externalSchedules.get(String(subscriptionId)) || null;
};

export default {
  registerSubscription,
  updateBillingSchedule,
  pauseBillingSchedule,
  resumeBillingSchedule,
  cancelBillingSchedule,
  getBillingSchedule
};
