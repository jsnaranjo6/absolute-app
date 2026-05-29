'use strict';

const { randomUUID } = require('crypto');
const { supabase } = require('./supabase');

/**
 * Wawa Tickets payment integration.
 *
 * PLACEHOLDER: real HTTP calls are stubbed until the Wawa API docs arrive. Each
 * method writes a payment_transactions row (status 'pending'), simulates a
 * charge, then flips the row to 'completed' (or 'failed'), and returns a
 * normalized { success, wawaTransactionId, error } result.
 *
 * Flat fee model: $1/transaction (informational; not enforced here).
 */

async function createPending(gymId, memberId, type, amount, metadata = {}) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({ gym_id: gymId, member_id: memberId, type, amount, status: 'pending', metadata })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function settle(txnId, status, wawaTransactionId) {
  const patch = { status };
  if (wawaTransactionId) patch.wawa_transaction_id = wawaTransactionId;
  await supabase.from('payment_transactions').update(patch).eq('id', txnId);
}

/**
 * Simulate a charge against the Wawa gateway. Replace the body with a real
 * fetch() to WAWA_API_URL once docs are available.
 */
async function simulateCharge(_payload) {
  const wawaTransactionId = `wawa_mock_${randomUUID()}`;
  return { ok: true, wawaTransactionId };
}

async function runCharge(gymId, memberId, type, amount, metadata) {
  const txn = await createPending(gymId, memberId, type, amount, metadata);
  try {
    const res = await simulateCharge({ gymId, memberId, type, amount, ...metadata });
    if (!res.ok) {
      await settle(txn.id, 'failed', res.wawaTransactionId);
      return { success: false, wawaTransactionId: res.wawaTransactionId || null, error: res.error || 'charge_failed', paymentTransactionId: txn.id };
    }
    await settle(txn.id, 'completed', res.wawaTransactionId);
    return { success: true, wawaTransactionId: res.wawaTransactionId, error: null, paymentTransactionId: txn.id };
  } catch (err) {
    await settle(txn.id, 'failed');
    return { success: false, wawaTransactionId: null, error: err.message, paymentTransactionId: txn.id };
  }
}

const chargeSubscriptionRenewal = (gymId, memberId, amount, planType) =>
  runCharge(gymId, memberId, 'subscription_renewal', amount, { planType });

const chargeWalletTopUp = (gymId, memberId, amount) =>
  runCharge(gymId, memberId, 'wallet_top_up', amount, {});

const chargeNoShowFee = (gymId, memberId, amount, classId) =>
  runCharge(gymId, memberId, 'no_show_fee', amount, { classId });

const chargeLateCancelFee = (gymId, memberId, amount, bookingId) =>
  runCharge(gymId, memberId, 'cancellation_fee', amount, { bookingId });

const redeemReferralCredit = (gymId, memberId, amount) =>
  runCharge(gymId, memberId, 'wallet_top_up', amount, { source: 'referral_credit' });

const refund = (gymId, transactionId, amount, reason) =>
  runCharge(gymId, null, 'refund', amount, { originalTransactionId: transactionId, reason });

module.exports = {
  chargeSubscriptionRenewal,
  chargeWalletTopUp,
  chargeNoShowFee,
  chargeLateCancelFee,
  redeemReferralCredit,
  refund,
  // exposed for the webhook handler / tests
  settle,
  createPending,
};
