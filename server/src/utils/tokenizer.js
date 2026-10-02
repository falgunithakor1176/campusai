/**
 * Tokenizer and Text Utilities
 *
 * Provides character and word-based token estimation and text chunking
 * utility functions for context management.
 *
 * @module utils/tokenizer
 */

'use strict';

/**
 * Estimates token count based on English text (approx. 4 characters/1 word per token).
 * @param {string} text
 * @returns {number} Estimated token count
 */
const estimateTokens = (text) => {
  if (!text) return 0;
  // Standard approximation: 1 token ~= 4 characters or 0.75 words
  return Math.ceil(text.length / 4);
};

/**
 * Truncates text to fit within a specified token limit.
 * @param {string} text
 * @param {number} maxTokens
 * @returns {string} Truncated text
 */
const truncateToTokenLimit = (text, maxTokens) => {
  if (!text) return '';
  const estCharLimit = maxTokens * 4;
  if (text.length <= estCharLimit) return text;
  return text.substring(0, estCharLimit) + '... [Content truncated due to length]';
};

/**
 * Builds chat context from history, ensuring it fits within token limits.
 * @param {Array<{ role: string, content: string }>} messages
 * @param {number} [maxTokens=4000]
 * @returns {string} Formatted context
 */
const buildChatContext = (messages, maxTokens = 4000) => {
  if (!messages || messages.length === 0) return '';

  let context = '';
  // Iterate backwards to prioritize recent messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const messageStr = `${msg.role.toUpperCase()}: ${msg.content}\n`;
    if (estimateTokens(context + messageStr) > maxTokens) {
      break;
    }
    context = messageStr + context;
  }
  return context.trim();
};

module.exports = { estimateTokens, truncateToTokenLimit, buildChatContext };
