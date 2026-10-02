/**
 * Authentication Routes
 *
 * Defines endpoints and mounts validation middleware for user registration,
 * login, token rotation, and logging out.
 *
 * @module routes/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../schemas/auth.schema');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, login, logout, and token rotation
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new student user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rohan Sharma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rohan.sharma@student.campusai.edu.in
 *               password:
 *                 type: string
 *                 example: Student@123
 *               collegeSlug:
 *                 type: string
 *                 example: campusai-demo
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(authController.register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@campusai.edu.in
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Logged in successfully
 */
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token to get a new access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token rotated successfully
 */
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out user and revoke refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', asyncHandler(authController.logout));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get profile details of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved
 */
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
