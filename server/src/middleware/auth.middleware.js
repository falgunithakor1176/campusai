/**
 * Authentication Middleware
 *
 * Verifies JWT access tokens and attaches the authenticated user
 * payload to req.user. Supports both strict and optional authentication.
 *
 * @module middleware/auth
 */

'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler.middleware');

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * authenticate - Strict authentication middleware.
 * Rejects the request with 401 if no valid token is provided.
 *
 * @type {import('express').RequestHandler}
 */
const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Attach decoded payload to request for downstream use
    req.user = {
      id: payload.userId, // Map to id for backward compatibility
      userId: payload.userId,
      role: payload.role,
      collegeId: payload.collegeId || null,
      profileId: payload.profileId || null,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'TOKEN_INVALID'));
  }
};

/**
 * authenticateOptional - Soft authentication middleware.
 * Attaches req.user if a valid token is present, but does NOT
 * reject the request if no token exists (used for guest access).
 *
 * @type {import('express').RequestHandler}
 */
const authenticateOptional = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: payload.userId, // Map to id for backward compatibility
      userId: payload.userId,
      role: payload.role,
      collegeId: payload.collegeId || null,
      profileId: payload.profileId || null,
    };
  } catch {
    // Invalid token — treat as guest, do not fail
    req.user = null;
  }

  return next();
};

module.exports = { authenticate, authenticateOptional };
