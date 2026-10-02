/**
 * Faculty Repository
 *
 * Handles database operations for the Faculty model.
 * Extends the BaseRepository for generic CRUD operations.
 *
 * @module repositories/faculty
 */

'use strict';

const BaseRepository = require('./base.repository');

class FacultyRepository extends BaseRepository {
  constructor() {
    super('faculty');
  }

  /**
   * Find a faculty member by their user account ID.
   * @param {string} userId
   * @returns {Promise<any | null>}
   */
  async findByUserId(userId) {
    return this.model.findUnique({
      where: { userId },
    });
  }

  /**
   * Find all faculty members belonging to a specific department.
   * @param {string} departmentId
   * @returns {Promise<any[]>}
   */
  async findByDepartment(departmentId) {
    return this.findMany({
      where: { departmentId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new FacultyRepository();
