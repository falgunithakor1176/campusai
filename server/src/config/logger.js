/**
 * @fileoverview Winston Logger Configuration
 * @description Structured JSON logging with multiple transports:
 *              - Console (colorized, human-readable for development)
 *              - File: logs/error.log (errors only, for alerting)
 *              - File: logs/combined.log (all levels, for auditing)
 *
 *              Also exports a Morgan-compatible stream for HTTP request logging.
 *
 * @module src/config/logger
 *
 * @example
 * const logger = require('./config/logger');
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('Database error', { error: err.message, stack: err.stack });
 */

'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// ─── Ensure Log Directory Exists ──────────────────────────────────────────────
const logDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ─── Custom Log Formats ───────────────────────────────────────────────────────

/**
 * Timestamp format for all log entries.
 * Uses ISO 8601 format for easy parsing and sorting.
 */
const timestampFormat = format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss.SSS',
});

/**
 * Console format: colorized, human-readable.
 * Example output:
 * 2025-01-15 10:30:45.123 [info] Server started { port: 5000 }
 */
const consoleFormat = format.combine(
  timestampFormat,
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...metadata }) => {
    // Filter out noise from metadata
    const { splat, service, ...cleanMeta } = metadata;
    const metaStr =
      Object.keys(cleanMeta).length > 0 ? `\n  ${JSON.stringify(cleanMeta, null, 2)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

/**
 * File format: structured JSON for machine parsing.
 * Each log entry is a single JSON line for easy grep and log aggregation.
 * Example:
 * {"timestamp":"2025-01-15 10:30:45.123","level":"error","message":"DB error","service":"campusai-server"}
 */
const fileFormat = format.combine(
  timestampFormat,
  format.errors({ stack: true }), // Include stack traces for Error objects
  format.json()
);

// ─── Logger Instance ──────────────────────────────────────────────────────────

/**
 * The main Winston logger instance.
 * Log level is controlled by the LOG_LEVEL environment variable.
 * Defaults to 'info' in production, 'debug' in development.
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  defaultMeta: {
    service: 'campusai-server',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // ── Console Transport ───────────────────────────────────────────────────
    new transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test', // Suppress logs during testing
    }),

    // ── Error Log File ──────────────────────────────────────────────────────
    /**
     * Captures only ERROR level logs.
     * Used for setting up alerts and monitoring.
     * Max size: 20MB per file, keeps last 14 days of files.
     */
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14,
      tailable: true,
    }),

    // ── Combined Log File ───────────────────────────────────────────────────
    /**
     * Captures ALL log levels.
     * Used for complete audit trail and debugging.
     * Max size: 50MB per file, keeps last 30 days of files.
     */
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 30,
      tailable: true,
    }),
  ],

  // Don't crash the process on logger errors
  exitOnError: false,
});

// ─── Morgan Stream Integration ────────────────────────────────────────────────

/**
 * Morgan-compatible write stream.
 * Pipes Morgan's HTTP request logs into Winston's 'http' level.
 * This centralizes all logging through Winston rather than having
 * two separate log outputs.
 *
 * @type {{ write: (message: string) => void }}
 *
 * @example
 * // In app.js:
 * app.use(morgan('combined', { stream: logger.stream }));
 */
logger.stream = {
  /**
   * @param {string} message - Log message from Morgan
   */
  write(message) {
    // Morgan adds a trailing newline — trim it for clean JSON logs
    logger.http(message.trim());
  },
};

module.exports = logger;
