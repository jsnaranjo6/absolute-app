'use strict';

/**
 * Number of days each plan type adds when started/renewed. 'special' has no
 * fixed length — callers must supply explicit dates for it.
 */
const PLAN_DAYS = {
  daily: 1,
  monthly: 30,
  bi_monthly: 60,
  tri_monthly: 90,
  annual: 365,
};

/** Add n days to a YYYY-MM-DD date string, returning YYYY-MM-DD. */
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute the end_date for a plan starting on startDate.
 * @returns {string} YYYY-MM-DD
 */
function computeEndDate(planType, startDate) {
  const days = PLAN_DAYS[planType];
  if (!days) {
    throw new Error(`Plan type '${planType}' has no fixed duration; supply end_date explicitly`);
  }
  return addDays(startDate, days);
}

module.exports = { PLAN_DAYS, addDays, computeEndDate };
