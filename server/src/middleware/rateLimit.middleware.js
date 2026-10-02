/**
 * Rate Limiting Middleware
 *
 * Provides tiered rate limiting for different API endpoint categories
 * to protect against brute-force attacks and API abuse.
 *
 * @module middleware/rateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');

/** @type {import('express-rate-limit').Options} */
const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      errors: [],
    });
  },
};

/**
 * Global limiter applied to all API routes.
 * 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

/**
 * Auth limiter for login and register routes.
 * 10 requests per 15 minutes per IP (brute-force prevention).
 */
const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      errors: [],
    });
  },
});

/**
 * AI chat limiter. 20 requests per minute per IP.
 * Applied to the AI message endpoint to control Gemini API costs.
 */
const aiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 20,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'AI query limit reached. Please wait a moment before asking another question.',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      errors: [],
    });
  },
});

/**
 * File upload limiter. 10 uploads per hour per IP.
 */
const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Upload limit reached. Maximum 10 files per hour.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      errors: [],
    });
  },
});

module.exports = { globalLimiter, authLimiter, aiLimiter, uploadLimiter };
