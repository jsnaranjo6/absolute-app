'use strict';

const cron = require('node-cron');

const { runRenewals } = require('./renewals');

/**
 * Central scheduler. Jobs are registered here and started from server.js.
 * Cron expressions run in the server's local time; per-gym local-time nuances
 * are handled inside each job (e.g. renewals respects gym timezone when
 * resolving "today"). Set process.env.CRON_DISABLED=true to skip scheduling
 * (useful in tests / single-shot environments).
 *
 * Schedule:
 *   renewals       — daily 00:01
 *   noShows        — every 15 minutes        (Phase 6)
 *   streaks        — daily 02:00             (Phase 7)
 *   churnDetection — daily 03:00             (Phase 8)
 */
function start() {
  if (process.env.CRON_DISABLED === 'true') {
    console.log('[cron] disabled via CRON_DISABLED');
    return [];
  }

  const jobs = [];
  const register = (name, expr, fn) => {
    const job = cron.schedule(expr, () => {
      Promise.resolve(fn()).catch((err) => console.error(`[cron:${name}] failed:`, err.message));
    });
    jobs.push({ name, job });
    console.log(`[cron] registered ${name} (${expr})`);
  };

  register('renewals', '1 0 * * *', runRenewals);

  // Registered as later phases land:
  try { register('noShows', '*/15 * * * *', require('./noShows').runNoShowSweep); } catch (_e) { /* Phase 6 */ }
  try { register('streaks', '0 2 * * *', require('./streaks').runStreakReset); } catch (_e) { /* Phase 7 */ }
  try { register('churnDetection', '0 3 * * *', require('./churnDetection').runChurnDetection); } catch (_e) { /* Phase 8 */ }

  return jobs;
}

module.exports = { start };
