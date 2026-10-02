'use strict';

/**
 * Chat Validation Schemas (Zod) — Phase 6C
 *
 * Enforces strict input validation on all chat API endpoints.
 */

const { z } = require('zod');

const createSessionSchema = z.object({
  title: z.string().trim().max(100, 'Title cannot exceed 100 characters').optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format').optional().nullable(),
  message: z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(3000, 'Message cannot exceed 3000 characters'),
  topK: z.number().int().min(1).max(20).optional().default(5),
});

const feedbackSchema = z.object({
  messageId: z.string().uuid('Invalid message ID format'),
  feedback: z.enum(['POSITIVE', 'NEGATIVE', 'NONE'], {
    errorMap: () => ({ message: 'Feedback must be POSITIVE, NEGATIVE, or NONE' }),
  }),
});

const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

module.exports = {
  createSessionSchema,
  sendMessageSchema,
  feedbackSchema,
  sessionIdParamSchema,
};
