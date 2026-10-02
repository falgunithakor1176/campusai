/**
 * User Repository
 *
 * Handles database operations for the User and RefreshToken models.
 * Extends the BaseRepository for generic CRUD operations.
 *
 * @module repositories/user
 */

'use strict';

const BaseRepository = require('./base.repository');
const prisma = require('../config/database');

class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  /**
   * Find a user by unique ID, filtering out soft-deleted users.
   * @param {string} id
   * @param {object} [include]
   * @returns {Promise<any | null>}
   */
  async findById(id, include = null) {
    return this.model.findFirst({
      where: { id, deletedAt: null },
      ...(include && { include }),
    });
  }

  /**
   * Find a user by their unique email address, filtering out soft-deleted users.
   * @param {string} email
   * @param {object} [include]
   * @returns {Promise<any | null>}
   */
  async findByEmail(email, include = null) {
    return this.model.findFirst({
      where: { email, deletedAt: null },
      ...(include && { include }),
    });
  }

  /**
   * Find a user by their student roll number.
   * @param {string} rollNumber
   * @returns {Promise<any | null>}
   */
  async findByRollNumber(rollNumber) {
    const student = await prisma.student.findUnique({
      where: { rollNumber },
      include: { user: true },
    });
    if (student && student.user && !student.user.deletedAt) {
      return {
        ...student.user,
        student,
      };
    }
    return null;
  }

  /**
   * Soft delete a user by ID.
   * @param {string} id
   * @returns {Promise<any>}
   */
  async delete(id) {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Save a new refresh token to the database.
   * @param {string} userId
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<any>}
   */
  async saveRefreshToken(userId, token, expiresAt) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find a refresh token.
   * @param {string} token
   * @returns {Promise<any | null>}
   */
  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            student: true,
            faculty: true,
          },
        },
      },
    });
  }

  /**
   * Revoke a refresh token.
   * @param {string} token
   * @returns {Promise<any>}
   */
  async revokeRefreshToken(token) {
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user.
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

module.exports = new UserRepository();
