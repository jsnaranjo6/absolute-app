'use strict';

const { supabase } = require('./supabase');
const wawa = require('./wawaTickets');
const ApiError = require('../utils/ApiError');

/** Map a coded exception raised by the SQL purchase function to an ApiError. */
function mapPurchaseError(message) {
  const m = String(message || '');
  if (m.includes('PRODUCT_NOT_FOUND')) return ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  if (m.includes('PRODUCT_INACTIVE')) return ApiError.badRequest('Product is not available', 'PRODUCT_INACTIVE');
  if (m.includes('OUT_OF_STOCK')) return ApiError.conflict('Product out of stock', 'OUT_OF_STOCK');
  if (m.includes('NO_WALLET')) return ApiError.badRequest('No wallet account', 'NO_WALLET');
  if (m.includes('INSUFFICIENT_BALANCE')) return ApiError.paymentRequired('Insufficient balance', 'INSUFFICIENT_BALANCE');
  return null;
}

async function getBalance(gymId, memberId) {
  const { data, error } = await supabase
    .from('wallet_accounts').select('balance, updated_at')
    .eq('gym_id', gymId).eq('member_id', memberId).limit(1);
  if (error) throw error;
  const acct = data && data[0];
  return { balance: acct ? Number(acct.balance) : 0, updated_at: acct ? acct.updated_at : null };
}

/** Effective balance = wallet balance (fees may have driven it negative). */
async function hasUnpaidFees(gymId, memberId) {
  const { balance } = await getBalance(gymId, memberId);
  return balance < 0;
}

async function listTransactions(gymId, memberId, { limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('wallet_transactions').select('*')
    .eq('gym_id', gymId).eq('member_id', memberId)
    .order('created_at', { ascending: false }).limit(Math.min(limit, 500));
  if (error) throw error;
  return data;
}

async function adminListTransactions(gymId, { memberId, type, limit = 200 } = {}) {
  let q = supabase.from('wallet_transactions').select('*').eq('gym_id', gymId)
    .order('created_at', { ascending: false }).limit(Math.min(limit, 1000));
  if (memberId) q = q.eq('member_id', memberId);
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/** Top up: charge via Wawa, then atomically credit the wallet on success. */
async function topUp(gymId, memberId, amount) {
  const charge = await wawa.chargeWalletTopUp(gymId, memberId, amount);
  if (!charge.success) {
    throw ApiError.paymentRequired('Top-up charge failed', 'TOPUP_FAILED');
  }
  const { data, error } = await supabase.rpc('credit_wallet', {
    p_gym_id: gymId,
    p_member_id: memberId,
    p_amount: amount,
    p_type: 'top_up',
    p_description: 'Wallet top-up',
    p_reference: charge.paymentTransactionId || null,
  });
  if (error) throw error;
  return { ...data, wawa_transaction_id: charge.wawaTransactionId };
}

/** Buy a product atomically (balance + stock checks in SQL). */
async function purchase(gymId, memberId, productId) {
  const { data, error } = await supabase.rpc('purchase_product', {
    p_gym_id: gymId, p_member_id: memberId, p_product_id: productId,
  });
  if (error) {
    const mapped = mapPurchaseError(error.message);
    if (mapped) throw mapped;
    throw error;
  }

  if (data && data.low_stock) {
    // Low-stock alert hook. Logged now; Phase 8 can dispatch a push to staff.
    console.warn(`[wallet] low stock: product=${data.product_id} remaining=${data.remaining_stock} gym=${gymId}`);
  }
  return data;
}

module.exports = {
  getBalance, hasUnpaidFees, listTransactions, adminListTransactions, topUp, purchase,
};
