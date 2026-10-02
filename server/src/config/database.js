/**
 * @fileoverview Prisma Client Singleton
 * @description Provides a single shared Prisma Client instance across the entire
 *              application. This prevents connection pool exhaustion, which is a
 *              common problem in development with Next.js/Node.js hot reloading,
 *              where each module reload creates a new PrismaClient instance.
 *
 * @pattern Singleton
 * @module src/config/database
 *
 * @example
 * const prisma = require('./config/database');
 * const users = await prisma.user.findMany();
 */

'use strict';

const { PrismaClient } = require('@prisma/client');

// ─── Singleton Implementation ─────────────────────────────────────────────────

/**
 * The log levels for Prisma vary by environment:
 * - development: Log all queries, errors, and warnings for debugging
 * - production: Log only errors and warnings to reduce noise
 *
 * @type {import('@prisma/client').PrismaClientOptions['log']}
 */
const prismaLogConfig =
  process.env.NODE_ENV === 'development'
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ];

/**
 * Creates and returns a singleton PrismaClient instance.
 *
 * The global.__prisma pattern ensures that in development mode,
 * when Node.js hot-reloads modules, we reuse the existing client
 * instead of creating a new one on every file change.
 *
 * In production, the module cache handles the singleton naturally,
 * so global.__prisma is only needed in development.
 *
 * @type {PrismaClient}
 */
const prisma =
  global.__prisma ||
  new PrismaClient({
    log: prismaLogConfig,
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });

// ─── Development Log Event Handlers ──────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  /**
   * Log every SQL query in development for debugging performance.
   * Shows the raw SQL, parameters, and execution duration.
   *
   * @listens PrismaClient#query
   */
  prisma.$on('query', (e) => {
    // Avoid circular dependency by requiring logger inline
    // Only log if LOG_LEVEL is debug to reduce noise
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[Prisma Query] ${e.duration}ms → ${e.query}`);
    }
  });

  /**
   * Log Prisma warnings (e.g., deprecated APIs, missing indexes).
   *
   * @listens PrismaClient#warn
   */
  prisma.$on('warn', (e) => {
    console.warn('[Prisma Warning]', e.message);
  });

  /**
   * Log Prisma errors to console in development.
   *
   * @listens PrismaClient#error
   */
  prisma.$on('error', (e) => {
    console.error('[Prisma Error]', e.message);
  });

  // Store in global to survive hot reloads in development
  global.__prisma = prisma;
}

module.exports = prisma;
