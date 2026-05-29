'use strict';

const authService = require('../services/authService');

async function register(req, res) {
  const { name, email, password, gender } = req.body;
  const result = await authService.register({ gymId: req.gym.id, name, email, password, gender });
  res.status(201).json(result);
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await authService.login({ gymId: req.gym.id, email, password });
  res.json(result);
}

async function refresh(req, res) {
  const token = authService.refresh(req.user);
  res.json({ token });
}

module.exports = { register, login, refresh };
