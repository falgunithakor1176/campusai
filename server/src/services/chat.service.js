'use strict';

/**
 * ChatService — Hybrid AI Assistant
 *
 * Orchestrates a two-track answer pipeline:
 *  - ERP Track: Structured questions (events, fees, timetable, notices) → PostgreSQL via ErpRepository
 *  - RAG Track: Policy/handbook questions → pgvector semantic search → Gemini
 *  - Hybrid: Merges both context sources when a question touches both domains
 *  - Falls back gracefully if Gemini API is unavailable
 */

const chatRepository = require('../repositories/chat.repository');
const retrievalService = require('./retrieval.service');
const { classifyIntent, fetchErpData, formatErpContext } = require('./erp.service');
const logger = require('../config/logger');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const MAX_HISTORY_MESSAGES = 6; // Keep last 6 turns for conversational context

class ChatService {
  /**
   * Create a new chat session for a user.
   *
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} [params.title="New Chat"]
   * @returns {Promise<Object>}
   */
  async createSession({ userId, title = 'New Chat' }) {
    logger.info(`💬 Creating new chat session for user ${userId}`);
    return chatRepository.createSession({ userId, title });
  }

  /**
   * Get all active chat sessions for a user.
   *
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getSessions(userId) {
    return chatRepository.getSessionsByUser(userId);
  }

  /**
   * Get specific session details along with full message history.
   *
   * @param {string} sessionId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getSessionDetails(sessionId, userId) {
    const session = await chatRepository.getSessionWithMessages(sessionId, userId);
    if (!session) {
      const error = new Error('Chat session not found or unauthorized');
      error.statusCode = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }
    return session;
  }

  /**
   * Soft/Hard delete a chat session.
   *
   * @param {string} sessionId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async deleteSession(sessionId, userId) {
    return chatRepository.deleteSession(sessionId, userId);
  }

  /**
   * Send a user query to the RAG chatbot, retrieve knowledge, generate answer, and store turn.
   *
   * @param {Object} params
   * @param {string} [params.sessionId] - Optional existing session ID
   * @param {string} params.message - User input query
   * @param {number} [params.topK=5] - Top-K retrieval chunks
   * @param {Object} params.user - Current user object from req.user
   * @returns {Promise<Object>}
   */
  async sendMessage({ sessionId, message, topK = 5, user }) {
    const startTime = Date.now();
    const userId = user.id;
    const collegeId = user.collegeId;

    // 1. Ensure active session exists or create one
    let session;
    if (sessionId) {
      session = await chatRepository.getSessionWithMessages(sessionId, userId);
      if (!session) {
        logger.warn(`Session ${sessionId} not found for user ${userId}. Creating new session.`);
        session = await chatRepository.createSession({ userId, title: message.slice(0, 45) + (message.length > 45 ? '...' : '') });
      }
    } else {
      const autoTitle = message.slice(0, 45) + (message.length > 45 ? '...' : '');
      session = await chatRepository.createSession({ userId, title: autoTitle });
    }

    // 2. Save user message to database
    const userMessageRecord = await chatRepository.createMessage({
      sessionId: session.id,
      role: 'USER',
      content: message.trim(),
    });

    // 3. Classify intent: detect if query needs ERP data, RAG, or both
    const erpIntents = classifyIntent(message);
    const needsErp = erpIntents.length > 0;
    logger.info(`🔀 Hybrid routing — ERP intents: [${erpIntents.join(', ') || 'none'}] | RAG: always`);

    // 4. Fetch ERP data + RAG context in parallel for maximum speed
    const [erpData, retrievedChunks] = await Promise.all([
      needsErp && collegeId
        ? fetchErpData(erpIntents, collegeId).catch(e => {
            logger.warn('ERP data fetch failed (non-fatal):', e.message);
            return {};
          })
        : Promise.resolve({}),
      retrievalService.search(message, { topK, user, collegeId }).catch(e => {
        logger.error('Vector retrieval failed during chat generation:', e.message);
        return [];
      }),
    ]);

    // 5. Build merged context block: ERP data first (structured/live), then RAG chunks (document-based)
    const erpContextBlock = needsErp ? formatErpContext(erpData) : '';
    const ragContextBlock = this._formatContextBlock(retrievedChunks);
    const contextBlock = [
      erpContextBlock ? `${erpContextBlock}` : '',
      ragContextBlock !== 'No relevant institutional documents found in the database for this query.'
        ? `=== KNOWLEDGE BASE (Document Policies) ===\n${ragContextBlock}`
        : '',
    ].filter(Boolean).join('\n\n') || 'No relevant information found for this query.';

    // 6. Build conversation history for multi-turn context
    const historyMessages = (session.messages || []).slice(-MAX_HISTORY_MESSAGES);

    // 7. Call Google Gemini API with unified context
    let rawAiText = '';
    let tokensUsed = null;
    try {
      const geminiResult = await this._callGeminiRag({
        query: message,
        contextBlock,
        historyMessages,
      });
      rawAiText = geminiResult.text;
      tokensUsed = geminiResult.tokensUsed;
    } catch (aiErr) {
      logger.warn('Gemini API call failed. Using fallback generator:', aiErr.message);
      rawAiText = this._generateFallbackResponse(message, retrievedChunks, erpData);
    }

    // 7. Extract main answer and suggested questions
    const { answer, suggestedQuestions } = this._parseAnswerAndQuestions(rawAiText, retrievedChunks);

    const responseTimeMs = Date.now() - startTime;

    // 8. Save assistant reply to database with citations metadata
    const assistantMessageRecord = await chatRepository.createMessage({
      sessionId: session.id,
      role: 'ASSISTANT',
      content: answer,
      sources: retrievedChunks,
      tokensUsed,
      responseTimeMs,
    });

    // 9. Update session stats (increment message count by 2: user + assistant)
    const isFirstTurn = (session.messageCount || 0) <= 1 && session.title === 'New Chat';
    const newTitle = isFirstTurn ? message.slice(0, 45) + (message.length > 45 ? '...' : '') : null;
    await chatRepository.updateSessionStats(session.id, 2, newTitle);

    return {
      success: true,
      data: {
        sessionId: session.id,
        sessionTitle: newTitle || session.title,
        userMessage: userMessageRecord,
        assistantMessage: {
          id: assistantMessageRecord.id,
          role: assistantMessageRecord.role,
          content: assistantMessageRecord.content,
          sources: retrievedChunks,
          tokensUsed: assistantMessageRecord.tokensUsed,
          responseTimeMs: assistantMessageRecord.responseTimeMs,
          feedback: assistantMessageRecord.feedback,
          createdAt: assistantMessageRecord.createdAt,
        },
        suggestedQuestions,
      },
    };
  }

  /**
   * Submit feedback (POSITIVE, NEGATIVE, NONE) for an assistant message.
   *
   * @param {Object} params
   * @param {string} params.messageId
   * @param {string} params.feedback
   * @returns {Promise<Object>}
   */
  async submitFeedback({ messageId, feedback }) {
    const updated = await chatRepository.updateMessageFeedback(messageId, feedback);
    return {
      success: true,
      message: 'Feedback recorded successfully',
      data: updated,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Format retrieved chunks into a structured context string for Gemini prompt.
   * @private
   */
  _formatContextBlock(chunks) {
    if (!chunks || chunks.length === 0) {
      return 'No relevant institutional documents found in the database for this query.';
    }

    return chunks
      .map((c, idx) => {
        const title = c.documentTitle || 'Institutional Document';
        const page = c.pageNumber ? `Page ${c.pageNumber}` : 'N/A';
        const section = c.sectionTitle || 'General Section';
        const score = c.similarityScore ? `Score: ${c.similarityScore.toFixed(3)}` : '';
        return `[Citation ${idx + 1} | Document: "${title}" | ${page} | Section: "${section}" | ${score}]\n${c.content.trim()}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Call Google Gemini API (gemini-2.0-flash) with structured RAG prompt.
   * @private
   */
  async _callGeminiRag({ query, contextBlock, historyMessages }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_api_key')) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    // System instructions tailored for clean, human-readable answers
    const systemText =
      `You are College Chatbot, a friendly and knowledgeable AI assistant for a college. You help students, faculty, and administrators get quick, accurate answers about college rules, policies, fees, admissions, hostel, exams, placements, and more.\n\n` +
      `STRICT RESPONSE FORMAT:\n` +
      `1. Write a clear, concise, helpful answer in natural language — as if you are a knowledgeable advisor explaining it directly to the user.\n` +
      `2. Use SHORT sentences. Use bullet points for lists of rules, steps, or requirements. Use bold (**text**) for key terms and numbers.\n` +
      `3. Structure long answers with a brief intro, bullet points for details, and a short closing sentence if needed.\n` +
      `4. DO NOT paste or quote raw document text verbatim. DO NOT include document titles, page numbers, citation markers (like [Citation 1], [Source: ...]), or source references anywhere inside your main answer text.\n` +
      `5. DO NOT start with phrases like "According to the documents..." or "Based on the retrieved context...". Just answer directly and naturally.\n` +
      `6. ONLY use information from the CONTEXT provided. If the answer is not in the context, say: "I don't have specific information on this in the college documents. Please check with your department or college office."\n` +
      `7. At the very end of your response, output exactly 3 relevant follow-up questions the user might want to ask next, using this exact format on a new line:\n\n` +
      `---SUGGESTED_QUESTIONS---\n` +
      `- Follow-up question 1\n` +
      `- Follow-up question 2\n` +
      `- Follow-up question 3`;

    // Build multi-turn contents array
    const contents = [];

    // Append prior conversational context
    historyMessages.forEach((msg) => {
      if (msg.role === 'USER') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'ASSISTANT') {
        // Strip out old suggested questions block from history so Gemini focuses on chat flow
        const cleanOldText = msg.content.split('---SUGGESTED_QUESTIONS---')[0].trim();
        contents.push({ role: 'model', parts: [{ text: cleanOldText }] });
      }
    });

    // Current turn with RAG context injected as background knowledge only
    const currentTurnPrompt =
      `BACKGROUND KNOWLEDGE — use this to inform your answer, but do NOT quote it verbatim, do NOT print document titles or citation markers inside your answer:\n` +
      `${contextBlock}\n\n` +
      `---\n\n` +
      `User Question: ${query}\n\n` +
      `Answer the question in a clear, friendly, and direct way using only the background knowledge above. Write your answer in natural language with bullet points where helpful. Do not mention document names or page numbers in the answer itself.`;

    contents.push({ role: 'user', parts: [{ text: currentTurnPrompt }] });

    const payload = {
      system_instruction: {
        parts: [{ text: systemText }],
      },
      contents,
      generationConfig: {
        temperature: 0.35, // Slightly warmer for natural, readable prose while staying factual
        maxOutputTokens: 2500,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55_000), // 55s — fails fast before frontend 90s timeout
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API returned status ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content returned from Gemini');
    }

    const tokensUsed = data?.usageMetadata?.totalTokenCount || null;
    return { text: candidateText, tokensUsed };
  }

  /**
   * Parse Gemini output separating main markdown answer from suggested questions.
   * @private
   */
  _parseAnswerAndQuestions(aiText, chunks) {
    const parts = aiText.split('---SUGGESTED_QUESTIONS---');
    const answer = parts[0].trim();
    let suggestedQuestions = [];

    if (parts.length > 1) {
      const qLines = parts[1]
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d+.]+\s*/, ''))
        .filter((l) => l.length > 5 && l.includes('?'));
      suggestedQuestions = qLines.slice(0, 3);
    }

    // Fallback suggested questions if parsing yielded less than 2
    if (suggestedQuestions.length < 2) {
      const defaultDomainQuestions = [
        'What are the minimum attendance criteria and condonation rules?',
        'How can I access remote digital libraries and IEEE resources?',
        'What is the dress code and anti-ragging reporting procedure?',
        'What are the hostel timings and room allocation guidelines?',
      ];
      suggestedQuestions = defaultDomainQuestions.slice(0, 3);
    }

    return { answer, suggestedQuestions };
  }

  /**
   * Synthesize a natural-language answer from retrieved chunks when Gemini API is unavailable.
   * Produces a clean, readable response — not a document dump.
   * @private
   */
  _generateFallbackResponse(query, chunks, erpData = {}) {
    const { formatErpContext: fmt } = require('./erp.service');
    const erpContext = fmt(erpData);

    // If we have live ERP data, use it as primary fallback content
    if (erpContext && erpContext.trim().length > 50) {
      const heading = query.length > 60 ? query.slice(0, 57) + '...' : query;
      // Extract bullet points from ERP context lines
      const bullets = erpContext
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('===') && l.trim().length > 10)
        .slice(0, 8)
        .map(l => `- ${l.replace(/^[-•*]\s*/, '').trim()}`)
        .join('\n');

      return (
        `## ${heading}\n\n` +
        `Here is the latest information from the college system:\n\n` +
        `${bullets}\n\n` +
        `---SUGGESTED_QUESTIONS---\n` +
        `- What are the scholarship deadlines and eligibility criteria?\n` +
        `- What are the upcoming events and workshops this semester?\n` +
        `- What is the fee structure for my department?`
      );
    }

    if (!chunks || chunks.length === 0) {
      return (
        `I don't have specific information about that in the college knowledge base. ` +
        `Please check with your department coordinator or the college administration office for accurate details.\n\n` +
        `---SUGGESTED_QUESTIONS---\n` +
        `- What is the minimum attendance requirement for exams?\n` +
        `- How do I apply for a scholarship at CADCE?\n` +
        `- What are the hostel rules and timings?`
      );
    }

    // Collect unique readable sentences from RAG chunks
    const allPoints = [];
    const seenKeys = new Set();
    for (const chunk of chunks) {
      const sentences = (chunk.content || '')
        .split(/\n+|(?<=\.)\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 400);
      for (const s of sentences) {
        const key = s.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allPoints.push(s);
        }
        if (allPoints.length >= 8) break;
      }
      if (allPoints.length >= 8) break;
    }

    const bullets = allPoints
      .slice(0, 6)
      .map(p => `- ${p.replace(/^[-•*]\s*/, '').trim()}`)
      .join('\n');

    const heading = query.length > 60 ? query.slice(0, 57) + '...' : query;
    const q = query.toLowerCase();

    let followUps = [
      'What are the rules for re-examinations and KT (Keep Term) exams?',
      'What scholarships are available for engineering students?',
      'What are the hostel accommodation rules and timings?',
    ];
    if (q.includes('attendance')) {
      followUps = [
        'What is the condonation policy for attendance shortage?',
        'How is attendance calculated for each subject?',
        'What happens if I have a medical leave and miss classes?',
      ];
    } else if (q.includes('fee') || q.includes('fees')) {
      followUps = [
        'What is the late payment penalty and refund policy?',
        'Which scholarships can help reduce my tuition fees?',
        'How do I get a fee receipt or payment confirmation?',
      ];
    } else if (q.includes('exam') || q.includes('grading') || q.includes('cgpa')) {
      followUps = [
        'What is the passing criteria and KT examination process?',
        'How is the 10-point CGPA calculated?',
        'What are the rules for malpractice during exams?',
      ];
    } else if (q.includes('hostel')) {
      followUps = [
        'What are the mess timings and visitor policy?',
        'How is room allocation done in the hostel?',
        'What are the disciplinary rules for hostel residents?',
      ];
    } else if (q.includes('scholarship')) {
      followUps = [
        'What documents are needed to apply for a scholarship?',
        'What is the deadline for scholarship applications?',
        'Are sports or merit-based scholarships available?',
      ];
    } else if (q.includes('placement') || q.includes('internship')) {
      followUps = [
        'What companies recruit from CADCE and what packages are offered?',
        'Is an internship mandatory and how many credits does it carry?',
        'How do I register for campus placement drives?',
      ];
    }

    return (
      `## ${heading}\n\n` +
      `Here is what the official college documents say about this:\n\n` +
      `${bullets}\n\n` +
      `For complete details, please refer to the cited documents below or contact the college administration.\n\n` +
      `---SUGGESTED_QUESTIONS---\n` +
      `- ${followUps[0]}\n` +
      `- ${followUps[1]}\n` +
      `- ${followUps[2]}`
    );
  }
}

module.exports = new ChatService();
