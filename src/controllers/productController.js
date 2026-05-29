'use strict';

const productService = require('../services/productService');

async function listPublic(req, res) {
  res.json({ products: await productService.listActive(req.user.gym_id) });
}

async function adminList(req, res) {
  res.json({ products: await productService.listAll(req.user.gym_id) });
}

async function create(req, res) {
  res.status(201).json(await productService.create(req.user.gym_id, req.body));
}

async function update(req, res) {
  res.json(await productService.update(req.user.gym_id, req.params.id, req.body));
}

async function remove(req, res) {
  res.json(await productService.deactivate(req.user.gym_id, req.params.id));
}

module.exports = { listPublic, adminList, create, update, remove };
