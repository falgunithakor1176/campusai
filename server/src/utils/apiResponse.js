/**
 * Standardized API Response Utility
 *
 * Provides a consistent JSON response format across all API endpoints.
 * All responses follow the same envelope structure for predictable client-side handling.
 *
 * @module utils/apiResponse
 */

'use strict';

/**
 * ApiResponse - Static utility class for building standardized HTTP responses.
 *
 * Response Envelope Structure:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any | null,
 *   pagination?: { page, limit, total, totalPages },
 *   errors?: Array<{ field, message }>,
 *   code?: string
 * }
 */
class ApiResponse {
  /**
   * Send a successful response.
   * @param {import('express').Response} res
   * @param {*} data - Response payload.
   * @param {string} [message='Success'] - Human-readable success message.
   * @param {number} [statusCode=200] - HTTP status code.
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send a paginated list response.
   * @param {import('express').Response} res
   * @param {Array} data - Array of records.
   * @param {number} page - Current page number.
   * @param {number} limit - Items per page.
   * @param {number} total - Total record count.
   * @param {string} [message='Records retrieved successfully']
   */
  static paginated(res, data, page, limit, total, message = 'Records retrieved successfully') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: parseInt(page, 10) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page, 10) > 1,
      },
    });
  }

  /**
   * Send a created (201) response.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='Resource created successfully']
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an error response.
   * @param {import('express').Response} res
   * @param {string} message - Error message.
   * @param {number} [statusCode=400]
   * @param {string} [code='ERROR']
   * @param {Array} [errors=[]]
   */
  static error(res, message, statusCode = 400, code = 'ERROR', errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      errors,
      data: null,
    });
  }

  /**
   * Send a 404 Not Found response.
   * @param {import('express').Response} res
   * @param {string} [resource='Resource']
   */
  static notFound(res, resource = 'Resource') {
    return ApiResponse.error(res, `${resource} not found.`, 404, 'NOT_FOUND');
  }

  /**
   * Send a 401 Unauthorized response.
   * @param {import('express').Response} res
   * @param {string} [message='Authentication required.']
   */
  static unauthorized(res, message = 'Authentication required. Please log in.') {
    return ApiResponse.error(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Send a 403 Forbidden response.
   * @param {import('express').Response} res
   * @param {string} [message='Access denied.']
   */
  static forbidden(res, message = 'Access denied. You do not have permission to perform this action.') {
    return ApiResponse.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * Send a 204 No Content response (for DELETE operations).
   * @param {import('express').Response} res
   */
  static noContent(res) {
    return res.status(204).end();
  }
}

module.exports = ApiResponse;
