/**
 * Role-Based Access Control Middleware
 *
 * Provides role guards for protecting routes by user role.
 * Must be used AFTER the authenticate middleware.
 *
 * @module middleware/role
 */

'use strict';

const { AppError } = require('./errorHandler.middleware');

/**
 * requireRole - Factory function that creates a role-checking middleware.
 *
 * @param {...string} roles - One or more allowed roles (e.g., 'ADMIN', 'FACULTY').
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/departments', authenticate, requireRole('ADMIN'), createDept);
 *   router.get('/profile', authenticate, requireRole('STUDENT', 'FACULTY'), getProfile);
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
        403,
        'FORBIDDEN'
      )
    );
  }
  return next();
};

/** Restricts access to ADMIN role only. */
const requireAdmin = requireRole('ADMIN');

/** Restricts access to FACULTY or ADMIN roles. */
const requireFacultyOrAdmin = requireRole('FACULTY', 'ADMIN');

/** Requires any authenticated user (STUDENT, FACULTY, or ADMIN). */
const requireAuth = requireRole('STUDENT', 'FACULTY', 'ADMIN');

module.exports = { requireRole, requireAdmin, requireFacultyOrAdmin, requireAuth };
