/**
 * Error Handler Middleware
 *
 * Provides a centralized, structured error handling system for the entire API.
 * Handles Prisma, JWT, Multer, Zod, and custom application errors uniformly.
 *
 * @module middleware/errorHandler
 */

'use strict';

const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const logger = require('../config/logger');

// ─── Custom Application Error Class ──────────────────────────────

/**
 * AppError - Standardized operational error class.
 * Used throughout the application to throw predictable, documented errors.
 *
 * @class AppError
 * @extends Error
 * @example
 *   throw new AppError('Department not found', 404, 'NOT_FOUND');
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} [statusCode=400] - HTTP status code.
   * @param {string} [code='ERROR'] - Machine-readable error code.
   * @param {boolean} [isOperational=true] - Is this a known/expected error?
   */
  constructor(message, statusCode = 400, code = 'ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Prisma Error Mapper ──────────────────────────────────────────

/**
 * Maps Prisma client error codes to user-friendly messages and HTTP status codes.
 * @param {Prisma.PrismaClientKnownRequestError} err
 * @returns {{ message: string, statusCode: number, code: string }}
 */
const mapPrismaError = (err) => {
  switch (err.code) {
    case 'P2002': {
      const field = err.meta?.target?.[0] || 'field';
      return { message: `A record with this ${field} already exists.`, statusCode: 409, code: 'DUPLICATE_ENTRY' };
    }
    case 'P2025':
      return { message: 'The requested record was not found.', statusCode: 404, code: 'NOT_FOUND' };
    case 'P2003':
      return { message: 'This operation violates a foreign key constraint.', statusCode: 400, code: 'FOREIGN_KEY_VIOLATION' };
    case 'P2014':
      return { message: 'The operation would violate a required relation.', statusCode: 400, code: 'RELATION_VIOLATION' };
    case 'P2016':
      return { message: 'Query interpretation error.', statusCode: 400, code: 'QUERY_ERROR' };
    default:
      return { message: 'A database error occurred.', statusCode: 500, code: 'DATABASE_ERROR' };
  }
};

// ─── Global Express Error Handler ────────────────────────────────

/**
 * Express 4-parameter error handling middleware.
 * Must be registered LAST in the middleware chain.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // ── Zod Validation Error ──────────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Validation error', { path: req.path, errors });
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // ── Prisma Known Request Error ────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { message, statusCode, code } = mapPrismaError(err);
    logger.warn('Prisma error', { code: err.code, path: req.path });
    return res.status(statusCode).json({ success: false, message, code, errors: [] });
  }

  // ── Prisma Validation Error ───────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn('Prisma validation error', { path: req.path });
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided to the database.',
      code: 'DB_VALIDATION_ERROR',
      errors: [],
    });
  }

  // ── JWT Errors ────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.', code: 'TOKEN_EXPIRED', errors: [] });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.', code: 'TOKEN_INVALID', errors: [] });
  }
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({ success: false, message: 'Token is not yet active.', code: 'TOKEN_NOT_ACTIVE', errors: [] });
  }

  // ── Multer Errors ─────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.`, code: 'FILE_TOO_LARGE', errors: [] });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Unexpected file field in form upload.', code: 'UNEXPECTED_FILE', errors: [] });
  }

  // ── Custom AppError ───────────────────────────────────────────
  if (err instanceof AppError) {
    logger.warn('Application error', { code: err.code, message: err.message, path: req.path });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: [],
    });
  }

  // ── Unknown / Unhandled Error (500) ───────────────────────────
  logger.error('Unhandled server error', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
    errors: [],
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = { errorHandler, AppError };
