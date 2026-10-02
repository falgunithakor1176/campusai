/**
 * Health Check Routes
 *
 * Provides health monitoring endpoints for load balancers, Docker,
 * and uptime monitoring services.
 *
 * @module routes/health
 */

'use strict';

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns server status, environment, and uptime. Used by load balancers and Docker health checks.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     environment:
 *                       type: string
 *                       example: development
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 3600.5
 */
router.get('/', asyncHandler(healthController.basicHealth));

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database connectivity check
 *     description: Verifies that the PostgreSQL database is reachable and responding.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 *       503:
 *         description: Database is unreachable
 */
router.get('/db', asyncHandler(healthController.dbHealth));

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed system status
 *     description: Returns full system information including memory usage, node version, and all service statuses.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed system information
 */
router.get('/detailed', asyncHandler(healthController.detailedHealth));

module.exports = router;
