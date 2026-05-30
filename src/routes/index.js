'use strict';

const express = require('express');

const router = express.Router();

// Health check (unauthenticated).
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gymos-backend', time: new Date().toISOString() });
});

// Phase 2 — Member identity & access
router.use('/auth', require('./auth.routes'));
router.use('/members', require('./members.routes'));
router.use('/checkins', require('./checkins.routes'));
router.use('/admin/members', require('./adminMembers.routes'));

// Phase 3 — Subscriptions
const subs = require('./subscriptions.routes');
router.use('/subscriptions', subs.memberRouter);
router.use('/admin/subscriptions', subs.adminRouter);

// Phase 4 — Virtual wallet & products
const wallet = require('./wallet.routes');
const products = require('./products.routes');
router.use('/wallet', wallet.router);
router.use('/admin/wallet', wallet.adminRouter);
router.use('/products', products.router);
router.use('/admin/products', products.adminRouter);

// Phase 5 — Machine help system
const machines = require('./machines.routes');
const helpRequests = require('./helpRequests.routes');
router.use('/machines', machines.router);
router.use('/admin/machines', machines.adminRouter);
router.use('/help-requests', helpRequests.router);
router.use('/admin/help-requests', helpRequests.adminRouter);

module.exports = router;
