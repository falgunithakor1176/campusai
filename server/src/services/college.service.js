/**
 * College Service
 *
 * Implements business logic for managing college profiles, metadata,
 * and system settings.
 *
 * @module services/college
 */

'use strict';

const collegeRepository = require('../repositories/college.repository');
const { AppError } = require('../middleware/errorHandler.middleware');

class CollegeService {
  /**
   * Retrieves a college by its unique ID.
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getCollegeById(id) {
    const college = await collegeRepository.findById(id);
    if (!college) {
      throw new AppError('College not found.', 404, 'COLLEGE_NOT_FOUND');
    }
    return college;
  }

  /**
   * Retrieves a college profile by its unique URL slug.
   * @param {string} slug
   * @returns {Promise<any>}
   */
  async getCollegeBySlug(slug) {
    const college = await collegeRepository.findBySlug(slug);
    if (!college) {
      throw new AppError('College profile not found.', 404, 'COLLEGE_NOT_FOUND');
    }
    return college;
  }

  /**
   * Updates college details and configuration settings (Admin only).
   * @param {string} id
   * @param {object} updateData
   * @returns {Promise<any>}
   */
  async updateCollege(id, updateData) {
    // Ensure the college exists first
    await this.getCollegeById(id);

    return collegeRepository.update(id, updateData);
  }
}

module.exports = new CollegeService();
