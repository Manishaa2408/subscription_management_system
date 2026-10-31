/**
 * Robust Billing Date Calculation Utility for Subscriptions (M7)
 * Implements month-end policies, leap year handling, and anchor date retention.
 */

export const calculatePeriodDates = (startDateInput, frequency = "monthly", interval = 1, anchorDayInput = null) => {
  const start = new Date(startDateInput);
  const anchorDay = anchorDayInput || start.getUTCDate();
  const freq = (frequency || "monthly").toLowerCase();
  const intVal = Math.max(1, parseInt(interval, 10) || 1);

  const end = new Date(start.getTime());

  switch (freq) {
    case "daily": {
      end.setUTCDate(end.getUTCDate() + intVal);
      break;
    }
    case "weekly": {
      end.setUTCDate(end.getUTCDate() + (intVal * 7));
      break;
    }
    case "monthly": {
      addMonthsWithAnchor(end, intVal, anchorDay);
      break;
    }
    case "quarterly": {
      addMonthsWithAnchor(end, intVal * 3, anchorDay);
      break;
    }
    case "half_yearly": {
      addMonthsWithAnchor(end, intVal * 6, anchorDay);
      break;
    }
    case "yearly": {
      const targetYear = end.getUTCFullYear() + intVal;
      const targetMonth = end.getUTCMonth();
      // Handle Feb 29 leap year cases
      const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(anchorDay, daysInTargetMonth);
      end.setUTCFullYear(targetYear, targetMonth, targetDay);
      break;
    }
    case "one_time":
    default: {
      // Default to 1 month for standard subscription period if not recurring
      addMonthsWithAnchor(end, 1, anchorDay);
      break;
    }
  }

  // Current period ends 1 millisecond before next cycle begins, or same day
  const periodEnd = new Date(end.getTime() - 1000);
  const nextBillingDate = new Date(end.getTime());

  return {
    periodStart: start,
    periodEnd,
    nextBillingDate,
    anchorDay
  };
};

/**
 * Helper to add months while preserving the anchor day
 * e.g., Jan 31 + 1 month -> Feb 28/29 (last day), but retains anchor 31 for March
 */
function addMonthsWithAnchor(dateObj, monthsToAdd, anchorDay) {
  const currentMonth = dateObj.getUTCMonth();
  const targetMonthIndex = currentMonth + monthsToAdd;
  const targetYear = dateObj.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(anchorDay, daysInTargetMonth);

  dateObj.setUTCFullYear(targetYear, targetMonth, targetDay);
}

export default {
  calculatePeriodDates
};
