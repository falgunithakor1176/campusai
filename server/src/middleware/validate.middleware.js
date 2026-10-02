/**
 * Zod Validation Middleware
 *
 * Provides request body, query, and param validation using Zod schemas.
 * Validation errors are formatted and returned with a 422 status code.
 *
 * @module middleware/validate
 */

'use strict';

const { ZodError } = require('zod');

/**
 * validate - Factory that validates req.body against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/login', validate(loginSchema), authController.login);
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        code: 'VALIDATION_ERROR',
        errors,
      });
    }
    next(err);
  }
};

/**
 * validateQuery - Factory that validates req.query against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(422).json({ success: false, message: 'Invalid query parameters.', code: 'VALIDATION_ERROR', errors });
    }
    next(err);
  }
};

/**
 * validateParams - Factory that validates req.params against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(422).json({ success: false, message: 'Invalid route parameters.', code: 'VALIDATION_ERROR', errors });
    }
    next(err);
  }
};

module.exports = { validate, validateQuery, validateParams };
