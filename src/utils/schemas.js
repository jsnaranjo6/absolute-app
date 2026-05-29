'use strict';

const { z } = require('zod');

// Shared primitives reused across route validators.
const uuid = z.string().uuid();
const email = z.string().email().max(255);
const password = z.string().min(8).max(128);
const gender = z.enum(['male', 'female', 'other']);
const planType = z.enum(['daily', 'monthly', 'bi_monthly', 'tri_monthly', 'annual', 'special']);
const role = z.enum(['member', 'trainer', 'front_desk', 'manager', 'owner']);
const staffRole = z.enum(['trainer', 'front_desk', 'manager', 'owner']);

const idParam = z.object({ id: uuid });

module.exports = { z, uuid, email, password, gender, planType, role, staffRole, idParam };
