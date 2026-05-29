'use strict';

const subscriptionService = require('../services/subscriptionService');

/**
 * Daily subscription renewal sweep (scheduled 00:01).
 *
 * Finds active, auto-renew subscriptions whose end_date has passed, charges the
 * renewal via Wawa, and either extends (success) or expires (failure). On
 * failure a churn notification is triggered — wired through the notification
 * service in Phase 8; here we surface the failed member ids to the caller.
 *
 * @returns {Promise<{ processed: number, renewed: number, failed: Array }>}
 */
async function runRenewals() {
  const due = await subscriptionService.findDueForRenewal();
  let renewed = 0;
  const failed = [];

  for (const sub of due) {
    try {
      const result = await subscriptionService.renewOne(sub);
      if (result.renewed) {
        renewed += 1;
      } else {
        failed.push({ subscriptionId: sub.id, gymId: sub.gym_id, memberId: sub.member_id });
      }
    } catch (err) {
      console.error(`[cron:renewals] subscription ${sub.id} errored:`, err.message);
      failed.push({ subscriptionId: sub.id, gymId: sub.gym_id, memberId: sub.member_id, error: err.message });
    }
  }

  // Phase 8 hook: churn notifications for the failed renewals.
  try {
    const notifications = require('../services/notificationService');
    if (notifications && typeof notifications.notifyChurnOnFailedRenewal === 'function') {
      for (const f of failed) {
        await notifications.notifyChurnOnFailedRenewal(f.gymId, f.memberId);
      }
    }
  } catch (_e) {
    // notification service not present yet (pre-Phase 8) — safe to ignore.
  }

  console.log(`[cron:renewals] processed=${due.length} renewed=${renewed} failed=${failed.length}`);
  return { processed: due.length, renewed, failed };
}

module.exports = { runRenewals };
