'use strict';

/**
 * Vercel serverless entry point.
 *
 * Vercel invokes this module as a serverless function — it must export the
 * Express app directly (no app.listen()). dotenv is loaded here so env vars
 * set in the Vercel dashboard are available at cold-start.
 *
 * Cron jobs (renewals, no-shows, streaks, churn) cannot run inside a
 * serverless function. Use Vercel Cron Jobs (vercel.json crons block) or an
 * external scheduler (e.g. Railway, Render, GitHub Actions scheduled workflow)
 * to hit dedicated trigger endpoints once those are wired up.
 */

require('dotenv').config();

const { createApp } = require('../src/app');

const app = createApp();

module.exports = app;
