/**
 * Base Repository
 *
 * Provides standard CRUD database operations using Prisma.
 * All domain-specific repositories should extend this class.
 *
 * @template T - The Prisma model type
 * @module repositories/base
 */

'use strict';

const prisma = require('../config/database');

class BaseRepository {
  /**
   * @param {string} modelName - The name of the Prisma model (e.g., 'user', 'department')
   */
  constructor(modelName) {
    this.model = prisma[modelName];
    this.modelName = modelName;
  }

  /**
   * Find a record by unique ID.
   * @param {string} id
   * @param {object} [include] - Relational queries to include
   * @returns {Promise<any | null>}
   */
  async findById(id, include = null) {
    return this.model.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find a single record matching specific criteria.
   * @param {object} where
   * @param {object} [include]
   * @returns {Promise<any | null>}
   */
  async findOne(where, include = null) {
    return this.model.findFirst({
      where,
      ...(include && { include }),
    });
  }

  /**
   * Find multiple records matching specific criteria.
   * @param {object} [options]
   * @param {object} [options.where]
   * @param {object} [options.include]
   * @param {object} [options.orderBy]
   * @param {number} [options.skip]
   * @param {number} [options.take]
   * @returns {Promise<any[]>}
   */
  async findMany(options = {}) {
    return this.model.findMany(options);
  }

  /**
   * Create a new database record.
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return this.model.create({ data });
  }

  /**
   * Update an existing database record.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a database record by ID.
   * @param {string} id
   * @returns {Promise<any>}
   */
  async delete(id) {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Count records matching specific criteria.
   * @param {object} [where]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return this.model.count({ where });
  }
}

module.exports = BaseRepository;
