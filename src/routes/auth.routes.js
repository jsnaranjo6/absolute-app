'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const resolveGym = require('../middleware/resolveGym');
const { z, email, password, gender } = require('../utils/schemas');
const ctrl = require('../controllers/authController');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email,
  password,
  gender,
});

const loginSchema = z.object({ email, password });

// gym_id resolved from X-Gym-Id / X-Gym-Slug header (never from body).
router.post('/register', resolveGym, validate(registerSchema), asyncHandler(ctrl.register));
router.post('/login', resolveGym, validate(loginSchema), asyncHandler(ctrl.login));
router.post('/refresh', authenticate, asyncHandler(ctrl.refresh));

module.exports = router;
