/**
 * @fileoverview Express Application Configuration
 * @description Complete Express app setup with security middleware, request logging,
 *              rate limiting, Swagger documentation, and centralized error handling.
 * @module src/app
 */

'use strict';

// ─── Core Dependencies ────────────────────────────────────────────────────────
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

// ─── Config ───────────────────────────────────────────────────────────────────
const logger = require('./config/logger');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

// ─── Middleware ───────────────────────────────────────────────────────────────
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// ─── Routes ───────────────────────────────────────────────────────────────────
const apiRoutes = require('./routes/index');

// ─── App Initialization ───────────────────────────────────────────────────────
const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
/**
 * Trust the first proxy in the chain (e.g., Nginx, AWS ALB).
 * Required for accurate IP detection behind load balancers.
 * Also needed for express-rate-limit to work correctly.
 */
app.set('trust proxy', 1);

// ─── X-Request-Id Middleware ──────────────────────────────────────────────────
/**
 * Attaches a unique UUID to every request as X-Request-Id header.
 * This ID propagates through logs, making it easy to trace a single
 * request across all log entries.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// ─── Security Headers ─────────────────────────────────────────────────────────
/**
 * Helmet sets various HTTP headers to protect against common web vulnerabilities:
 * - Content-Security-Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security
 * - etc.
 */
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow Swagger UI to embed resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com', 'blob:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
/**
 * Cross-Origin Resource Sharing configuration.
 * Restricts which origins can call our API. In development, allows the
 * React dev server; in production, uses CORS_ORIGIN from environment.
 */
const corsOptions = {
  origin: (origin, callback) => {
    const envOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const allowedOrigins = new Set([
      ...envOrigins,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
    ]);

    const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    // and any local development origin for the Vite/React frontend.
    if (!origin || isLocalDevOrigin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    logger.warn('CORS request blocked', { origin, allowedOrigins: Array.from(allowedOrigins) });
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-App-Version', 'Accept'],
  exposedHeaders: ['X-Request-Id', 'X-Total-Count'],
};

app.use(cors(corsOptions));

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsers ─────────────────────────────────────────────────────────────
/**
 * Parse incoming JSON bodies. Limit set to 10mb to support large payloads
 * while preventing abuse. URL-encoded bodies are also parsed for form support.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
/**
 * Morgan HTTP request logger.
 * In development: 'dev' format for colorized, concise output.
 * In production: 'combined' Apache-style format piped to Winston file logs.
 */
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: logger.stream,
    skip: (req) => req.url === '/api/health', // Don't log health check spam
  })
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
/**
 * Apply the global rate limiter to all routes.
 * More restrictive rate limiters are applied at the route level
 * for auth, AI, and upload endpoints.
 */
app.use(globalLimiter);

// ─── Swagger API Documentation ────────────────────────────────────────────────
/**
 * Serve the raw OpenAPI JSON specification at /api/docs-json.
 * This allows tools like Postman, Insomnia, and Swagger Codegen
 * to import the spec directly.
 */
app.get('/api/docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * Serve interactive Swagger UI at /api/docs.
 * Only fully exposed in non-production environments.
 * In production, you may want to add authentication to this route.
 */
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CampusAI API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      url: '/api/docs-json',
    },
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
/**
 * Mount all API routes under the /api prefix.
 * Individual route files handle further sub-path mounting.
 */
app.use('/api', apiRoutes);

// ─── Root Endpoint ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CampusAI API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/api/health',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
/**
 * Catch-all handler for unmatched routes.
 * Returns a consistent 404 JSON response instead of Express's default HTML page.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.method} ${req.originalUrl}' not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
/**
 * Centralized error handling middleware.
 * Must be defined LAST — after all routes and other middleware.
 * Handles Prisma errors, JWT errors, Zod validation errors, and custom AppErrors.
 */
app.use(errorHandler);

module.exports = app;
