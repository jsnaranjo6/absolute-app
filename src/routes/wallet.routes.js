'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, uuid } = require('../utils/schemas');
const ctrl = require('../controllers/walletController');

const money = z.number().positive().max(100000);

const topUpSchema = z.object({ amount: money });
const purchaseSchema = z.object({ product_id: uuid });

// Member wallet (mounted at /wallet)
const router = express.Router();
router.use(authenticate);
router.get('/me', asyncHandler(ctrl.getMine));
router.post('/topup', validate(topUpSchema), asyncHandler(ctrl.topUp));
router.get('/transactions', asyncHandler(ctrl.myTransactions));
router.post('/purchase', validate(purchaseSchema), asyncHandler(ctrl.purchase));

// Admin wallet (mounted at /admin/wallet)
const adminRouter = express.Router();
adminRouter.use(authenticate, requireStaff());
adminRouter.get('/transactions', asyncHandler(ctrl.adminTransactions));

module.exports = { router, adminRouter };
