'use strict';

require('dotenv').config();

const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[gymos] listening on :${PORT} (${process.env.NODE_ENV || 'development'})`);
  require('./cron').start();
});

function shutdown(signal) {
  console.log(`[gymos] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
