'use strict';

const { supabase } = require('./supabase');
const { encodeBarcode } = require('../utils/barcode');
const ApiError = require('../utils/ApiError');

const PUBLIC_FIELDS = 'id, gym_id, name, email, gender, role, photo_url, is_active, created_at, updated_at';

async function getById(gymId, memberId) {
  const { data, error } = await supabase
    .from('members')
    .select(PUBLIC_FIELDS)
    .eq('gym_id', gymId)
    .eq('id', memberId)
    .limit(1);
  if (error) throw error;
  if (!data || !data[0]) throw ApiError.notFound('Member not found', 'MEMBER_NOT_FOUND');
  return data[0];
}

/** Update own profile. Only safe self-editable fields are accepted. */
async function updateSelf(gymId, memberId, patch) {
  const allowed = {};
  for (const k of ['name', 'photo_url', 'gender']) {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  }
  if (Object.keys(allowed).length === 0) return getById(gymId, memberId);

  const { data, error } = await supabase
    .from('members')
    .update(allowed)
    .eq('gym_id', gymId)
    .eq('id', memberId)
    .select(PUBLIC_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

function getBarcode(gymId, memberId) {
  return { barcode: encodeBarcode(gymId, memberId), member_id: memberId };
}

/** Admin: list members with their current subscription status. */
async function listWithSubscriptionStatus(gymId, { search } = {}) {
  let q = supabase
    .from('members')
    .select(`${PUBLIC_FIELDS}, subscriptions(id, plan_type, status, start_date, end_date)`)
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  if (search) q = q.ilike('name', `%${search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data.map((m) => {
    const subs = m.subscriptions || [];
    const active = subs.find((s) => s.status === 'active') || subs[0] || null;
    const { subscriptions, ...member } = m;
    return { ...member, subscription: active };
  });
}

/** Admin: activate / deactivate or edit a member. */
async function adminUpdate(gymId, memberId, patch) {
  const allowed = {};
  for (const k of ['name', 'photo_url', 'gender', 'is_active', 'role']) {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  }
  const { data, error } = await supabase
    .from('members')
    .update(allowed)
    .eq('gym_id', gymId)
    .eq('id', memberId)
    .select(PUBLIC_FIELDS)
    .single();
  if (error) {
    if (error.code === 'PGRST116') throw ApiError.notFound('Member not found', 'MEMBER_NOT_FOUND');
    throw error;
  }
  return data;
}

module.exports = {
  getById, updateSelf, getBarcode, listWithSubscriptionStatus, adminUpdate, PUBLIC_FIELDS,
};
