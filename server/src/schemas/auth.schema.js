/**
 * Authentication Validation Schemas
 *
 * Defines Zod validation schemas for all authentication request payloads.
 *
 * @module schemas/auth
 */

'use strict';

const { z } = require('zod');

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .email('Invalid email address format')
  .toLowerCase();

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/** Validation for user registration (POST /auth/register) */
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters'),
  email: emailSchema,
  password: passwordSchema,
  collegeSlug: z.string().trim().optional(),
});

/** Validation for user login (POST /auth/login) */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }),
});

/** Validation for token refresh (POST /auth/refresh) */
const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }),
});

/** Validation for profile updates */
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().url('Invalid URL format').optional(),
});

/** Validation for password changes */
const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({ required_error: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
};
