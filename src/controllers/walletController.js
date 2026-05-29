'use strict';

const walletService = require('../services/walletService');

async function getMine(req, res) {
  res.json(await walletService.getBalance(req.user.gym_id, req.user.member_id));
}

async function topUp(req, res) {
  const result = await walletService.topUp(req.user.gym_id, req.user.member_id, req.body.amount);
  res.status(201).json(result);
}

async function myTransactions(req, res) {
  const transactions = await walletService.listTransactions(req.user.gym_id, req.user.member_id, {});
  res.json({ transactions });
}

async function purchase(req, res) {
  const result = await walletService.purchase(req.user.gym_id, req.user.member_id, req.body.product_id);
  res.status(201).json(result);
}

async function adminTransactions(req, res) {
  const transactions = await walletService.adminListTransactions(req.user.gym_id, {
    memberId: req.query.member_id, type: req.query.type,
  });
  res.json({ transactions });
}

module.exports = { getMine, topUp, myTransactions, purchase, adminTransactions };
