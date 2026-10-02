/**
 * Department Repository
 *
 * Handles database operations for the Department model.
 * Extends the BaseRepository for generic CRUD operations.
 *
 * @module repositories/department
 */

'use strict';

const BaseRepository = require('./base.repository');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super('department');
  }

  /**
   * Find a department by its unique code within a specific college.
   * @param {string} collegeId
   * @param {string} code
   * @returns {Promise<any | null>}
   */
  async findByCode(collegeId, code) {
    return this.model.findUnique({
      where: {
        collegeId_code: {
          collegeId,
          code,
        },
      },
    });
  }
}

module.exports = new DepartmentRepository();
