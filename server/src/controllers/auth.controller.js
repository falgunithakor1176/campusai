/**
 * Authentication Controller
 *
 * Exposes endpoint handlers for registration, login, token refresh,
 * logout, and current user retrieval.
 *
 * @module controllers/auth
 */

'use strict';

const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const ApiResponse = require('../utils/apiResponse');

/**
 * register - Route handler for user registration.
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const result = await authService.register(req.body);

  // Set refresh token in HttpOnly cookie for safety
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.created(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Registration successful.'
  );
};

/**
 * login - Route handler for user login.
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Login successful.'
  );
};

/**
 * refresh - Route handler for generating a new access token.
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  // Try extracting from body first, then fallback to cookie
  const refreshTokenVal = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshTokenVal) {
    return ApiResponse.error(res, 'Refresh token is required.', 400, 'REFRESH_TOKEN_REQUIRED');
  }

  const result = await authService.refresh(refreshTokenVal);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(
    res,
    { accessToken: result.accessToken },
    'Token refreshed successfully.'
  );
};

/**
 * logout - Route handler for user logout.
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  const refreshTokenVal = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logout(refreshTokenVal);

  res.clearCookie('refreshToken');
  return ApiResponse.success(res, null, 'Logged out successfully.');
};

/**
 * me - Route handler for returning the authenticated user's profile.
 * GET /api/auth/me
 */
const me = async (req, res) => {
  const user = await userRepository.findById(req.user.userId, {
    student: {
      include: {
        department: true,
      },
    },
    faculty: {
      include: {
        department: true,
      },
    },
  });
  if (!user) {
    return ApiResponse.error(res, 'User not found.', 404, 'USER_NOT_FOUND');
  }
  const { passwordHash: _, ...userWithoutPassword } = user;
  return ApiResponse.success(res, { user: userWithoutPassword }, 'User profile retrieved.');
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
