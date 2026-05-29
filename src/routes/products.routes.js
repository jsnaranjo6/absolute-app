'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, idParam } = require('../utils/schemas');
const ctrl = require('../controllers/productController');

const money = z.number().nonnegative().max(100000);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  emoji: z.string().max(16).optional(),
  price: money,
  category: z.string().max(60).optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

// Public (authenticated members) — mounted at /products
const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(ctrl.listPublic));

// Admin — mounted at /admin/products
const adminRouter = express.Router();
adminRouter.use(authenticate, requireStaff());
adminRouter.get('/', asyncHandler(ctrl.adminList));
adminRouter.post('/', validate(createSchema), asyncHandler(ctrl.create));
adminRouter.put('/:id', validate(idParam, 'params'), validate(updateSchema), asyncHandler(ctrl.update));
adminRouter.delete('/:id', validate(idParam, 'params'), asyncHandler(ctrl.remove));

module.exports = { router, adminRouter };
