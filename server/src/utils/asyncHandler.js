/**
 * Async Handler Utility
 *
 * Wraps asynchronous Express route handlers to automatically forward
 * any rejected promises to Express's error handling middleware.
 * Eliminates the need for try/catch blocks in every controller.
 *
 * @module utils/asyncHandler
 * @example
 *   // Without asyncHandler (verbose):
 *   router.get('/users', async (req, res, next) => {
 *     try { const users = await userService.findAll(); res.json(users); }
 *     catch (err) { next(err); }
 *   });
 *
 *   // With asyncHandler (clean):
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await userService.findAll();
 *     res.json(users);
 *   }));
 */

'use strict';

/**
 * asyncHandler - Wraps an async Express route handler.
 *
 * @param {Function} fn - Async Express handler function (req, res, next).
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * asyncMiddleware - Same as asyncHandler, aliased for middleware use.
 * Useful for async middleware functions that may also call next().
 *
 * @param {Function} fn
 * @returns {import('express').RequestHandler}
 */
const asyncMiddleware = asyncHandler;

module.exports = { asyncHandler, asyncMiddleware };
