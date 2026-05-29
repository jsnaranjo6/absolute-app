'use strict';

const bcrypt = require('bcryptjs');
const { supabase } = require('./supabase');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;

/**
 * Register a new member within a gym. gymId is supplied by resolveGym (header),
 * never by the client body. New self-registered users are always role 'member'.
 */
async function register({ gymId, name, email, password, gender }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data, error } = await supabase
    .from('members')
    .insert({
      gym_id: gymId,
      name,
      email: email.toLowerCase(),
      password_hash,
      gender,
      role: 'member',
    })
    .select('id, gym_id, name, email, gender, role, photo_url, is_active, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw ApiError.conflict('Email already registered', 'EMAIL_TAKEN');
    throw error;
  }

  // Every member gets a wallet account at registration.
  await supabase.from('wallet_accounts').insert({ gym_id: gymId, member_id: data.id, balance: 0 });
  await supabase.from('member_stats').insert({ gym_id: gymId, member_id: data.id });

  const token = signToken({ member_id: data.id, gym_id: gymId, role: data.role });
  return { member: data, token };
}

/**
 * Authenticate by gym + email + password. Returns a JWT on success.
 */
async function login({ gymId, email, password }) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('gym_id', gymId)
    .eq('email', email.toLowerCase())
    .limit(1);

  if (error) throw error;
  const member = data && data[0];

  // Uniform failure to avoid leaking which part was wrong.
  if (!member || !member.is_active) {
    throw ApiError.unauthorized('Invalid credentials', 'BAD_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, member.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials', 'BAD_CREDENTIALS');

  const token = signToken({ member_id: member.id, gym_id: gymId, role: member.role });
  return {
    member: {
      id: member.id, gym_id: member.gym_id, name: member.name, email: member.email,
      gender: member.gender, role: member.role, photo_url: member.photo_url,
    },
    token,
  };
}

/**
 * Issue a fresh token from a still-valid token's payload.
 */
function refresh(user) {
  return signToken({ member_id: user.member_id, gym_id: user.gym_id, role: user.role });
}

module.exports = { register, login, refresh };
