'use strict';

const machineService = require('../services/machineService');

async function listPublic(req, res) {
  res.json({ machines: await machineService.listActive(req.user.gym_id) });
}

async function getByQr(req, res) {
  res.json(await machineService.getByQrCode(req.user.gym_id, req.params.qr_code_id));
}

async function create(req, res) {
  res.status(201).json(await machineService.create(req.user.gym_id, req.body));
}

async function update(req, res) {
  res.json(await machineService.update(req.user.gym_id, req.params.id, req.body));
}

async function getQr(req, res) {
  res.json(await machineService.getQrValue(req.user.gym_id, req.params.id));
}

module.exports = { listPublic, getByQr, create, update, getQr };
