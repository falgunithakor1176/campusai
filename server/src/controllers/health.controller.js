/**
 * Health Controller
 *
 * Handles system health check requests for monitoring, Docker,
 * and load balancer health probes.
 *
 * @module controllers/health
 */

'use strict';

const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');

/**
 * basicHealth - Returns server status and uptime.
 * @type {import('express').RequestHandler}
 */
const basicHealth = async (req, res) => {
  return ApiResponse.success(res, {
    status: 'ok',
    service: 'CampusAI API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  }, 'Server is healthy');
};

/**
 * dbHealth - Verifies database connectivity by running a simple query.
 * @type {import('express').RequestHandler}
 */
const dbHealth = async (req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    return ApiResponse.success(res, {
      status: 'ok',
      database: 'PostgreSQL',
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    }, 'Database is connected');
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed.',
      code: 'DB_UNREACHABLE',
      data: {
        status: 'error',
        connected: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * detailedHealth - Full system status including memory and versions.
 * @type {import('express').RequestHandler}
 */
const detailedHealth = async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  let dbStatus = { connected: false, latencyMs: null };
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { connected: true, latencyMs: Date.now() - start };
  } catch {
    dbStatus = { connected: false, latencyMs: null };
  }

  return ApiResponse.success(res, {
    status: dbStatus.connected ? 'ok' : 'degraded',
    service: 'CampusAI API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
    },
    database: dbStatus,
  }, 'System status retrieved');
};

module.exports = { basicHealth, dbHealth, detailedHealth };
