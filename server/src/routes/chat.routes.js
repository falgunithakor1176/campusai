'use strict';

/**
 * Chat Routes — Phase 6C
 *
 * RAG Chatbot API endpoints for session management, multi-turn conversations,
 * semantic knowledge retrieval citations, and user feedback.
 *
 * All endpoints require authentication (authenticate middleware).
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const {
  createSessionSchema,
  sendMessageSchema,
  feedbackSchema,
  sessionIdParamSchema,
} = require('../schemas/chat.schema');
const { asyncHandler } = require('../utils/asyncHandler');

// Enforce authentication across all chat endpoints
router.use(authenticate);

// ─── Session Management ───────────────────────────────────────────────────────

// POST /api/chat/sessions - Create new chat session
router.post('/sessions', validate(createSessionSchema), asyncHandler(chatController.createSession));

// GET /api/chat/sessions - List active sessions for user
router.get('/sessions', asyncHandler(chatController.getSessions));

// GET /api/chat/sessions/:sessionId - Get specific session with full message history
router.get(
  '/sessions/:sessionId',
  validateParams(sessionIdParamSchema),
  asyncHandler(chatController.getSessionDetails)
);

// DELETE /api/chat/sessions/:sessionId - Delete specific session
router.delete(
  '/sessions/:sessionId',
  validateParams(sessionIdParamSchema),
  asyncHandler(chatController.deleteSession)
);

// ─── RAG Generation & Feedback ───────────────────────────────────────────────

// POST /api/chat/message - Send query, retrieve citations, and generate answer
router.post('/message', validate(sendMessageSchema), asyncHandler(chatController.sendMessage));

// POST /api/chat/feedback - Record thumbs up/down feedback for assistant turn
router.post('/feedback', validate(feedbackSchema), asyncHandler(chatController.submitFeedback));

module.exports = router;
