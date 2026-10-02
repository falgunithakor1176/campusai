/**
 * Course Repository
 *
 * Handles database operations for the Course model.
 * Extends the BaseRepository for generic CRUD operations.
 *
 * @module repositories/course
 */

'use strict';

const BaseRepository = require('./base.repository');

class CourseRepository extends BaseRepository {
  constructor() {
    super('course');
  }

  /**
   * Find a course by its unique alphanumeric code.
   * @param {string} code
   * @returns {Promise<any | null>}
   */
  async findByCode(code) {
    return this.model.findUnique({
      where: { code },
    });
  }

  /**
   * Find all courses in a specific department and semester.
   * @param {string} departmentId
   * @param {number} semester
   * @returns {Promise<any[]>}
   */
  async findByDepartmentAndSemester(departmentId, semester) {
    return this.findMany({
      where: {
        departmentId,
        semester: parseInt(semester, 10),
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new CourseRepository();
