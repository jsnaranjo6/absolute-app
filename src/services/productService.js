'use strict';

const { supabase } = require('./supabase');
const ApiError = require('../utils/ApiError');

async function listActive(gymId) {
  const { data, error } = await supabase
    .from('products').select('*').eq('gym_id', gymId).eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}

async function listAll(gymId) {
  const { data, error } = await supabase
    .from('products').select('*').eq('gym_id', gymId).order('name');
  if (error) throw error;
  return data;
}

async function create(gymId, body) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      gym_id: gymId,
      name: body.name,
      emoji: body.emoji,
      price: body.price,
      category: body.category,
      stock_quantity: body.stock_quantity ?? 0,
      low_stock_threshold: body.low_stock_threshold ?? 5,
      is_active: body.is_active ?? true,
    })
    .select('*').single();
  if (error) throw error;
  return data;
}

async function update(gymId, id, patch) {
  const allowed = {};
  for (const k of ['name', 'emoji', 'price', 'category', 'stock_quantity', 'low_stock_threshold', 'is_active']) {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  }
  const { data, error } = await supabase
    .from('products').update(allowed).eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) {
    if (error.code === 'PGRST116') throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    throw error;
  }
  return data;
}

/** Soft delete = deactivate (preserves transaction history references). */
async function deactivate(gymId, id) {
  const { data, error } = await supabase
    .from('products').update({ is_active: false }).eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) {
    if (error.code === 'PGRST116') throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    throw error;
  }
  return data;
}

module.exports = { listActive, listAll, create, update, deactivate };
