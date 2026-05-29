'use strict';

const svc = require('../services/subscriptionService');

async function getMine(req, res) {
  const sub = await svc.getMine(req.user.gym_id, req.user.member_id);
  res.json({ subscription: sub });
}

async function create(req, res) {
  const sub = await svc.create(req.user.gym_id, req.body);
  res.status(201).json(sub);
}

async function update(req, res) {
  const sub = await svc.update(req.user.gym_id, req.params.id, req.body);
  res.json(sub);
}

async function freeze(req, res) {
  const sub = await svc.freeze(req.user.gym_id, req.params.id);
  res.json(sub);
}

async function unfreeze(req, res) {
  const sub = await svc.unfreeze(req.user.gym_id, req.params.id);
  res.json(sub);
}

async function list(req, res) {
  const subs = await svc.list(req.user.gym_id, {
    status: req.query.status, memberId: req.query.member_id, planType: req.query.plan_type,
  });
  res.json({ subscriptions: subs });
}

module.exports = { getMine, create, update, freeze, unfreeze, list };
