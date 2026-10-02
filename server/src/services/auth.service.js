/**
 * Authentication Service
 *
 * Implements business logic for user registration, login, profile updates,
 * password changes, and JSON Web Token (JWT) issuing/rotation.
 *
 * @module services/auth
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const userRepository = require('../repositories/user.repository');
const collegeRepository = require('../repositories/college.repository');
const { AppError } = require('../middleware/errorHandler.middleware');

class AuthService {
  /**
   * Generates Access and Refresh Tokens for a validated user.
   * @param {object} user - User record from the database.
   * @returns {{ accessToken: string, refreshToken: string }}
   */
  generateTokens(user) {
    let profileId = null;
    if (user.student) {
      profileId = user.student.id;
    } else if (user.faculty) {
      profileId = user.faculty.id;
    }

    const payload = {
      userId: user.id,
      role: user.role,
      collegeId: user.collegeId,
      profileId,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Registers a new user.
   * @param {object} registerData
   * @param {string} registerData.name
   * @param {string} registerData.email
   * @param {string} registerData.password
   * @param {string} [registerData.collegeSlug]
   * @returns {Promise<object>} Created user and initial JWT tokens.
   */
  async register(registerData) {
    const { name, email, password, collegeSlug } = registerData;

    // Check if email already registered
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email address is already in use.', 409, 'EMAIL_IN_USE');
    }

    // Resolve college ID if slug is provided
    let collegeId = null;
    if (collegeSlug) {
      const college = await collegeRepository.findBySlug(collegeSlug);
      if (college) {
        collegeId = college.id;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and student profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          collegeId,
          role: 'STUDENT', // Default registration role is STUDENT
          status: 'ACTIVE',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: createdUser.id,
          isActive: true,
        },
      });

      return {
        ...createdUser,
        student,
      };
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    // Exclude password from return object
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Authenticates a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} Authenticated user details and JWT tokens.
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email, {
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
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login timestamp
    await userRepository.update(user.id, { lastLogin: new Date() });

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   * @param {string} refreshTokenVal
   * @returns {Promise<{ accessToken: string, refreshToken: string }>} New JWT token pair.
   */
  async refresh(refreshTokenVal) {
    // 1. Verify token exists in database and is not revoked
    const storedToken = await userRepository.findRefreshToken(refreshTokenVal);
    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token. Please log in again.', 401, 'TOKEN_INVALID');
    }

    // 2. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenVal, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid refresh token signature.', 401, 'TOKEN_INVALID');
    }

    // 3. Revoke the old token (token rotation pattern)
    await userRepository.revokeRefreshToken(refreshTokenVal);

    // 4. Generate new tokens
    const user = storedToken.user;
    const tokens = this.generateTokens(user);

    // 5. Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return tokens;
  }

  /**
   * Revokes a refresh token, logging the user out.
   * @param {string} refreshTokenVal
   * @returns {Promise<void>}
   */
  async logout(refreshTokenVal) {
    if (refreshTokenVal) {
      await userRepository.revokeRefreshToken(refreshTokenVal).catch(() => {
        // Silently catch errors if token doesn't exist
      });
    }
  }
}

module.exports = new AuthService();
