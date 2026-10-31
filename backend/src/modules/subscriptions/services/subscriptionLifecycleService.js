/**
 * Centralized Subscription Lifecycle State Machine Service (M7)
 */

export const ALLOWED_TRANSITIONS = {
  pending: ["trial", "active", "cancelled", "expired"],
  trial: ["active", "cancelled", "expired"],
  active: ["paused", "past_due", "cancelled", "expired"],
  paused: ["active", "cancelled", "expired"],
  past_due: ["active", "paused", "cancelled", "expired"],
  cancelled: [],
  expired: []
};

export const validateStatusTransition = (currentStatus, targetStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed) {
    const error = new Error(`Unknown current subscription status '${currentStatus}'`);
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus === targetStatus) {
    return true; // No-op transition
  }

  if (!allowed.includes(targetStatus)) {
    const error = new Error(
      `Invalid lifecycle transition: Cannot move subscription from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(", ") || "None (Terminal State)"}]`
    );
    error.statusCode = 400;
    throw error;
  }

  return true;
};

export default {
  ALLOWED_TRANSITIONS,
  validateStatusTransition
};
