'use strict';

/**
 * Chat Repository — Phase 6C
 *
 * Provides database operations for ChatSession and ChatMessage entities.
 * Extends BaseRepository using Prisma client.
 */

const BaseRepository = require('./base.repository');
const prisma = require('../config/database');

class ChatRepository extends BaseRepository {
  constructor() {
    super('chatSession');
  }

  /**
   * Create a new chat session for a user.
   *
   * @param {Object} data - Session data
   * @param {string} data.userId - ID of user owning the session
   * @param {string} [data.title="New Chat"] - Session title
   * @returns {Promise<Object>}
   */
  async createSession({ userId, title = 'New Chat' }) {
    return prisma.chatSession.create({
      data: {
        userId,
        title,
        isActive: true,
        messageCount: 0,
      },
    });
  }

  /**
   * Get all active chat sessions for a user ordered by recent activity.
   *
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>}
   */
  async getSessionsByUser(userId) {
    return prisma.chatSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a specific session along with all its chat messages.
   *
   * @param {string} sessionId - Session ID
   * @param {string} userId - Owner User ID for authorization
   * @returns {Promise<Object|null>}
   */
  async getSessionWithMessages(sessionId, userId) {
    return prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        isActive: true,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Soft delete or hard delete a chat session.
   *
   * @param {string} sessionId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async deleteSession(sessionId, userId) {
    // Check ownership first
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new Error('Chat session not found or unauthorized');
    }

    return prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Create a chat message inside a session.
   *
   * @param {Object} data - Message details
   * @param {string} data.sessionId - Parent Session ID
   * @param {string} data.role - USER or ASSISTANT
   * @param {string} data.content - Message text content
   * @param {Array|Object} [data.sources=[]] - Retrieved chunks/citations JSON
   * @param {number} [data.tokensUsed=null] - Tokens consumed
   * @param {number} [data.responseTimeMs=null] - Processing/generation duration
   * @returns {Promise<Object>}
   */
  async createMessage({
    sessionId,
    role,
    content,
    sources = [],
    tokensUsed = null,
    responseTimeMs = null,
  }) {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        sources: typeof sources === 'string' ? JSON.parse(sources) : sources,
        tokensUsed,
        responseTimeMs,
        feedback: 'NONE',
      },
    });

    return message;
  }

  /**
   * Update session stats after messages are added.
   *
   * @param {string} sessionId
   * @param {number} incrementCount
   * @param {string} [newTitle=null]
   * @returns {Promise<Object>}
   */
  async updateSessionStats(sessionId, incrementCount = 1, newTitle = null) {
    const data = {
      messageCount: {
        increment: incrementCount,
      },
    };
    if (newTitle) {
      data.title = newTitle;
    }

    return prisma.chatSession.update({
      where: { id: sessionId },
      data,
    });
  }

  /**
   * Update feedback on an assistant message.
   *
   * @param {string} messageId
   * @param {string} feedback - POSITIVE, NEGATIVE, or NONE
   * @returns {Promise<Object>}
   */
  async updateMessageFeedback(messageId, feedback) {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback },
    });
  }
}

module.exports = new ChatRepository();
