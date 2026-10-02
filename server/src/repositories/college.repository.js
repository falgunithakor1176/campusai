/**
 * College Repository
 *
 * Handles database operations for the College model.
 * Extends the BaseRepository for generic CRUD operations.
 *
 * @module repositories/college
 */

'use strict';

const BaseRepository = require('./base.repository');

class CollegeRepository extends BaseRepository {
  constructor() {
    super('college');
  }

  /**
   * Find a college by its unique slug identifier.
   * @param {string} slug
   * @returns {Promise<any | null>}
   */
  async findBySlug(slug) {
    return this.model.findUnique({
      where: { slug },
    });
  }
}

module.exports = new CollegeRepository();
