'use strict';

/**
 * Chat Controller — Phase 6C
 *
 * Handles HTTP requests for RAG chatbot conversations, session management,
 * history lookup, and user feedback submission.
 */

const chatService = require('../services/chat.service');
const logger = require('../config/logger');

class ChatController {
  /**
   * POST /api/chat/sessions
   * Create a new chat session.
   */
  async createSession(req, res) {
    const { title } = req.body || {};
    const session = await chatService.createSession({
      userId: req.user.id,
      title: title || 'New Chat',
    });

    return res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: session,
    });
  }

  /**
   * GET /api/chat/sessions
   * Get all active chat sessions for current user.
   */
  async getSessions(req, res) {
    const sessions = await chatService.getSessions(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Chat sessions retrieved successfully',
      data: sessions,
    });
  }

  /**
   * GET /api/chat/sessions/:sessionId
   * Get specific session details along with message history.
   */
  async getSessionDetails(req, res) {
    const session = await chatService.getSessionDetails(req.params.sessionId, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Chat session details retrieved successfully',
      data: session,
    });
  }

  /**
   * DELETE /api/chat/sessions/:sessionId
   * Delete a chat session.
   */
  async deleteSession(req, res) {
    await chatService.deleteSession(req.params.sessionId, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  }

  /**
   * POST /api/chat/message
   * Send a query to the RAG chatbot, retrieve knowledge, generate response, and store turn.
   */
  async sendMessage(req, res) {
    const { sessionId, message, topK } = req.body;

    const result = await chatService.sendMessage({
      sessionId,
      message,
      topK,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: 'Chatbot response generated successfully',
      data: result.data,
    });
  }

  /**
   * POST /api/chat/feedback
   * Submit feedback (POSITIVE, NEGATIVE, NONE) for an assistant message.
   */
  async submitFeedback(req, res) {
    const { messageId, feedback } = req.body;
    const result = await chatService.submitFeedback({ messageId, feedback });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  }
}

module.exports = new ChatController();
