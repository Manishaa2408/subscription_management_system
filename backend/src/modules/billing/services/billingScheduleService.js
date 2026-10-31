const BillingSchedule = require('../models/BillingSchedule');

/**
 * Checks if a given year is a leap year (Gregorian calendar rules)
 * @param {number} year 
 * @returns {boolean}
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Gets the number of days in a specific month of a specific year
 * @param {number} year 
 * @param {number} month (0-11)
 * @returns {number}
 */
const getDaysInMonth = (year, month) => {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

/**
 * Calculates the next billing date deterministically.
 * Uses UTC components to avoid daylight saving or local timezone skew.
 * 
 * Policies:
 * - Daily: adds interval days.
 * - Weekly: adds interval * 7 days.
 * - Monthly: advances month by interval. If original day was at or near month-end
 *   (e.g., 31st or 30th) and target month has fewer days, clamps to target month's last day
 *   (e.g., Jan 31 -> Feb 28/29).
 * - Yearly: advances year by interval. If Feb 29 in leap year -> Feb 28 in non-leap year.
 * 
 * @param {Date|string|number} baseDate 
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency 
 * @param {number} interval 
 * @returns {Date}
 */
const calculateNextBillingDate = (baseDate, frequency = 'monthly', interval = 1) => {
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid baseDate provided for billing calculation');
  }

  const safeInterval = Math.max(1, parseInt(interval, 10) || 1);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const date = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const ms = d.getUTCMilliseconds();

  switch (frequency.toLowerCase()) {
    case 'daily': {
      const next = new Date(d.getTime());
      next.setUTCDate(next.getUTCDate() + safeInterval);
      return next;
    }

    case 'weekly': {
      const next = new Date(d.getTime());
      next.setUTCDate(next.getUTCDate() + safeInterval * 7);
      return next;
    }

    case 'monthly': {
      const totalMonths = month + safeInterval;
      const targetYear = year + Math.floor(totalMonths / 12);
      const targetMonth = ((totalMonths % 12) + 12) % 12;
      const maxDaysInTargetMonth = getDaysInMonth(targetYear, targetMonth);

      // Clamp to month end if necessary
      const targetDate = Math.min(date, maxDaysInTargetMonth);
      return new Date(Date.UTC(targetYear, targetMonth, targetDate, hours, minutes, seconds, ms));
    }

    case 'yearly': {
      const targetYear = year + safeInterval;
      // Handle Feb 29 leap year policy
      let targetDate = date;
      let targetMonth = month;
      if (month === 1 && date === 29 && !isLeapYear(targetYear)) {
        targetDate = 28;
      }
      return new Date(Date.UTC(targetYear, targetMonth, targetDate, hours, minutes, seconds, ms));
    }

    default:
      throw new Error(`Unsupported billing frequency: '${frequency}'. Must be daily, weekly, monthly, or yearly.`);
  }
};

/**
 * Calculates current period [startDate, endDate]
 * endDate is 1 millisecond before next billing timestamp
 * @param {Date} periodStart 
 * @param {string} frequency 
 * @param {number} interval 
 * @returns {{ startDate: Date, endDate: Date }}
 */
const calculateBillingPeriod = (periodStart, frequency = 'monthly', interval = 1) => {
  const start = new Date(periodStart);
  const nextBilling = calculateNextBillingDate(start, frequency, interval);
  const end = new Date(nextBilling.getTime() - 1);
  return { startDate: start, endDate: end };
};

/**
 * Checks if billing is due
 * @param {Date} nextBillingDate 
 * @param {Date} asOfDate 
 * @returns {boolean}
 */
const isBillingDue = (nextBillingDate, asOfDate = new Date()) => {
  if (!nextBillingDate) return false;
  return new Date(nextBillingDate) <= new Date(asOfDate);
};

/**
 * Creates or updates a billing schedule
 */
const createOrUpdateSchedule = async (scheduleData) => {
  const {
    subscriptionId,
    customerId,
    planId,
    billingFrequency = 'monthly',
    billingInterval = 1,
    billingStartDate = new Date(),
    amountSnapshot,
    currency = 'INR'
  } = scheduleData;

  const start = new Date(billingStartDate);
  const { startDate, endDate } = calculateBillingPeriod(start, billingFrequency, billingInterval);
  const nextBillingDate = calculateNextBillingDate(start, billingFrequency, billingInterval);

  const existing = await BillingSchedule.findOne({ subscriptionId });
  if (existing) {
    existing.customerId = customerId || existing.customerId;
    existing.planId = planId || existing.planId;
    existing.billingFrequency = billingFrequency || existing.billingFrequency;
    existing.billingInterval = billingInterval || existing.billingInterval;
    existing.amountSnapshot = amountSnapshot !== undefined ? amountSnapshot : existing.amountSnapshot;
    existing.currency = currency || existing.currency;
    return await existing.save();
  }

  const schedule = new BillingSchedule({
    subscriptionId,
    customerId,
    planId,
    billingFrequency,
    billingInterval,
    billingStartDate: start,
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    nextBillingDate,
    status: 'active',
    currency,
    amountSnapshot
  });

  return await schedule.save();
};

/**
 * Returns due schedules from the database
 */
const getDueSchedules = async (asOfDate = new Date()) => {
  return await BillingSchedule.find({
    status: 'active',
    nextBillingDate: { $lte: new Date(asOfDate) }
  }).sort({ nextBillingDate: 1 });
};

/**
 * List schedules with pagination and filters
 */
const getSchedules = async (filters = {}, pagination = {}) => {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = {};

  if (filters.subscriptionId) query.subscriptionId = filters.subscriptionId;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.planId) query.planId = filters.planId;
  if (filters.status) query.status = filters.status;
  if (filters.billingFrequency) query.billingFrequency = filters.billingFrequency;
  if (filters.search) {
    query.$or = [
      { subscriptionId: { $regex: filters.search, $options: 'i' } },
      { customerId: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const [schedules, total] = await Promise.all([
    BillingSchedule.find(query).sort({ nextBillingDate: 1 }).skip(skip).limit(limit),
    BillingSchedule.countDocuments(query)
  ]);

  return {
    schedules,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const getScheduleById = async (id) => {
  return await BillingSchedule.findById(id);
};

const updateSchedule = async (id, updates) => {
  return await BillingSchedule.findByIdAndUpdate(id, updates, { new: true });
};

module.exports = {
  isLeapYear,
  getDaysInMonth,
  calculateNextBillingDate,
  calculateBillingPeriod,
  isBillingDue,
  createOrUpdateSchedule,
  getDueSchedules,
  getSchedules,
  getScheduleById,
  updateSchedule
};
