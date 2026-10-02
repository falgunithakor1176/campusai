/**
 * CampusAI Server - Entry Point
 *
 * Initializes environment variables, starts the Express HTTP server,
 * and configures graceful shutdown handlers for SIGTERM and SIGINT.
 *
 * @module server
 */

'use strict';

// ─── Load environment variables FIRST before any other imports ───
require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/config/logger');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Start HTTP Server ────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info('═══════════════════════════════════════════════════');
  logger.info(`  🎓 CampusAI Server started successfully`);
  logger.info(`  📡 Environment : ${NODE_ENV}`);
  logger.info(`  🚀 Port        : ${PORT}`);
  logger.info(`  📖 API Docs    : http://localhost:${PORT}/api/docs`);
  logger.info(`  ❤️  Health      : http://localhost:${PORT}/api/health`);
  logger.info('═══════════════════════════════════════════════════');
});

// ─── Graceful Shutdown Handler ────────────────────────────────────
/**
 * Performs a clean shutdown of the HTTP server and database connection.
 * @param {string} signal - The OS signal that triggered the shutdown.
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed. Disconnecting from database...');
    await prisma.$disconnect();
    logger.info('Database disconnected. Exiting process.');
    process.exit(0);
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Uncaught Error Handlers ──────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', { reason });
  process.exit(1);
});
