/**
 * College Validation Schemas
 *
 * Defines Zod validation schemas for all college-related entities.
 * Supports pagination, filtering, and CRUD operations.
 *
 * @module schemas/college
 */

'use strict';

const { z } = require('zod');

/** Standard pagination query parameters schema */
const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

const createDepartmentSchema = z.object({
  name: z.string({ required_error: 'Department name is required' }).trim().min(3).max(100),
  code: z.string({ required_error: 'Department code is required' }).trim().toUpperCase().min(2).max(10),
  description: z.string().trim().optional(),
  logoUrl: z.string().url('Invalid URL format').optional(),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  totalSeats: z.number().int().positive().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

const createFacultySchema = z.object({
  name: z.string({ required_error: 'Faculty name is required' }).trim().min(2),
  departmentId: z.string({ required_error: 'Department ID is required' }).uuid(),
  designation: z.string().trim().optional(),
  qualification: z.string().trim().optional(),
  email: z.string().email('Invalid email format').trim().toLowerCase().optional(),
  phone: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
});

const updateFacultySchema = createFacultySchema.partial();

const createCourseSchema = z.object({
  departmentId: z.string({ required_error: 'Department ID is required' }).uuid(),
  name: z.string({ required_error: 'Course name is required' }).trim().min(3),
  code: z.string({ required_error: 'Course code is required' }).trim().toUpperCase(),
  semester: z.number().int().min(1).max(10),
  credits: z.number().int().min(1).max(10).default(3),
  type: z.enum(['CORE', 'ELECTIVE', 'LAB', 'PROJECT', 'SEMINAR']).default('CORE'),
  description: z.string().trim().optional(),
});

const updateCourseSchema = createCourseSchema.partial();

module.exports = {
  paginationSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createFacultySchema,
  updateFacultySchema,
  createCourseSchema,
  updateCourseSchema,
};
