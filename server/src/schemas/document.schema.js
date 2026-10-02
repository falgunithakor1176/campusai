'use strict';

const { z } = require('zod');
const { DocumentCategory, DocumentVisibility } = require('@prisma/client');

const documentCategoryValues = Object.keys(DocumentCategory);
const documentVisibilityValues = Object.keys(DocumentVisibility);

const tagsTransform = z.union([
  z.array(z.string()),
  z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(Boolean))
]).optional();

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category: z.enum(documentCategoryValues, {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  tags: tagsTransform,
  visibility: z.enum(documentVisibilityValues, {
    errorMap: () => ({ message: 'Invalid visibility' })
  }).default('PRIVATE')
});

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().optional(),
  category: z.enum(documentCategoryValues).optional(),
  tags: tagsTransform,
  visibility: z.enum(documentVisibilityValues).optional()
});

const listSchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  category: z.enum(documentCategoryValues).optional(),
  status: z.string().optional(),
  visibility: z.enum(documentVisibilityValues).optional(),
  uploadedById: z.string().uuid().optional()
});

module.exports = {
  uploadSchema,
  updateSchema,
  listSchema
};
