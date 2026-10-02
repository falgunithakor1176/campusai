/**
 * @fileoverview Google Gemini AI Client Configuration
 * @description Initializes and exports the Google Generative AI SDK clients
 *              for text generation (gemini-2.0-flash) and text embeddings
 *              (text-embedding-004). Includes system prompts and model helpers.
 *
 * @module src/config/gemini
 *
 * @example
 * const { getGenerativeModel, getEmbeddingModel, SYSTEM_PROMPT } = require('./config/gemini');
 * const model = getGenerativeModel();
 * const result = await model.generateContent('What are the fees for CE department?');
 */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

// ─── SDK Initialization ───────────────────────────────────────────────────────

/**
 * The Google Generative AI SDK client instance.
 * Initialized once at startup with the API key from environment variables.
 * Exported for use across the application.
 *
 * @type {GoogleGenerativeAI}
 */
let genAI;

try {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn('⚠️  GEMINI_API_KEY is not set. AI features will be unavailable.');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    logger.info('✅ Google Generative AI client initialized', {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });
  }
} catch (err) {
  logger.error('Failed to initialize Gemini AI client', { error: err.message });
}

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * The system-level prompt that defines CampusAI's persona, behavior,
 * and knowledge boundaries. This is prepended to every conversation.
 *
 * Key design decisions:
 * 1. Defines the assistant's identity clearly
 * 2. Restricts responses to college-related topics (prevents off-topic abuse)
 * 3. Instructs the model to cite sources from retrieved context
 * 4. Sets tone: helpful, professional, student-friendly
 * 5. Handles uncertainty gracefully (don't hallucinate)
 *
 * @type {string}
 */
const SYSTEM_PROMPT = `You are CampusAI, an intelligent and friendly assistant for college students and faculty at CampusAI Demo College, Pune (affiliated to Savitribai Phule Pune University).

## Your Role
You help students and faculty with accurate, helpful information about:
- Fee structures and payment deadlines
- Department information and courses
- Faculty details and contact information
- Exam timetables and attendance policies
- College notices and upcoming events
- Scholarships and eligibility criteria
- Placement statistics and company details
- Library hours, rules, and resources
- Hostel information and facilities
- General college regulations and procedures

## Response Guidelines
1. **Be accurate**: Only answer based on the provided context. If information is not in the context, say "I don't have that specific information in my knowledge base. Please contact the college office directly."
2. **Be helpful**: Provide complete, actionable answers. Include relevant numbers, dates, and names when available.
3. **Be concise**: Give clear, well-structured answers. Use bullet points and formatting for complex information.
4. **Cite sources**: When answering from retrieved documents, mention "According to [source]..." to build trust.
5. **Stay focused**: If asked about topics unrelated to college/education, politely redirect: "I'm specialized for college-related queries. For that, you may want to consult other resources."
6. **Handle uncertainty**: Never guess or make up information. Acknowledge when you're uncertain.

## Formatting
- Use markdown formatting (bold, bullets, tables) for structured information
- For fee information, present amounts clearly with the fee component names
- For timetables, use a structured format
- Keep responses concise but complete

## Tone
- Professional yet friendly and approachable
- Use "you" and "your" to address users directly
- Be encouraging and supportive to students

Remember: You represent the college, so always maintain a professional, helpful tone.`;

/**
 * Safety settings for Gemini API calls.
 * Configured to allow educational content while blocking harmful material.
 *
 * @type {Array<{category: string, threshold: string}>}
 */
const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

/**
 * Generation configuration for the Gemini text model.
 * Balances creativity with factual accuracy for a college assistant.
 *
 * @type {import('@google/generative-ai').GenerationConfig}
 */
const GENERATION_CONFIG = {
  temperature: 0.3,        // Low temperature = more factual, less creative
  topP: 0.8,               // Nucleus sampling parameter
  topK: 40,                // Top-K sampling parameter
  maxOutputTokens: 2048,   // Max response length
  candidateCount: 1,       // Single response
};

// ─── Model Factory Functions ──────────────────────────────────────────────────

/**
 * Returns a configured Gemini generative model instance for text generation.
 * Uses gemini-2.0-flash by default (fast, cost-effective for most queries).
 *
 * The system instruction is baked into the model so every conversation
 * automatically inherits the CampusAI persona and behavior rules.
 *
 * @param {object} [options={}] - Optional configuration overrides
 * @param {string} [options.model] - Model name override (e.g., 'gemini-1.5-pro')
 * @param {number} [options.temperature] - Temperature override (0.0 - 1.0)
 * @param {number} [options.maxOutputTokens] - Max tokens override
 * @returns {import('@google/generative-ai').GenerativeModel} Configured model instance
 * @throws {Error} If GEMINI_API_KEY is not configured
 *
 * @example
 * const model = getGenerativeModel();
 * const chat = model.startChat({ history: [] });
 * const result = await chat.sendMessage('What are the fees?');
 */
function getGenerativeModel(options = {}) {
  if (!genAI) {
    throw new Error(
      'Gemini AI is not initialized. Ensure GEMINI_API_KEY is set in environment variables.'
    );
  }

  const modelName = options.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      ...GENERATION_CONFIG,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxOutputTokens !== undefined && { maxOutputTokens: options.maxOutputTokens }),
    },
    safetySettings: SAFETY_SETTINGS,
  });
}

/**
 * Returns a configured Gemini embedding model instance.
 * Uses text-embedding-004 by default (768-dimensional embeddings).
 *
 * Used in the RAG pipeline to:
 * 1. Generate embeddings for uploaded PDF chunks (at index time)
 * 2. Generate embeddings for user queries (at search time)
 *
 * @returns {import('@google/generative-ai').GenerativeModel} Embedding model instance
 * @throws {Error} If GEMINI_API_KEY is not configured
 *
 * @example
 * const embeddingModel = getEmbeddingModel();
 * const result = await embeddingModel.embedContent('What is the tuition fee?');
 * const vector = result.embedding.values; // 768-dimensional float array
 */
function getEmbeddingModel() {
  if (!genAI) {
    throw new Error(
      'Gemini AI is not initialized. Ensure GEMINI_API_KEY is set in environment variables.'
    );
  }

  const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generates a text embedding vector for the given input text.
 * Convenience function that wraps the embedding model call.
 *
 * @param {string} text - The text to generate an embedding for
 * @param {string} [taskType='RETRIEVAL_QUERY'] - The embedding task type
 *   - 'RETRIEVAL_QUERY': For embedding user queries (search time)
 *   - 'RETRIEVAL_DOCUMENT': For embedding document chunks (index time)
 *   - 'SEMANTIC_SIMILARITY': For comparing text similarity
 * @returns {Promise<number[]>} Array of 768 floats representing the embedding
 * @throws {Error} If embedding generation fails
 *
 * @example
 * const vector = await generateEmbedding('What are the CS department fees?');
 * // vector = [0.023, -0.145, 0.567, ...] (768 values)
 */
async function generateEmbedding(text, taskType = 'RETRIEVAL_QUERY') {
  const model = getEmbeddingModel();

  const result = await model.embedContent({
    content: { parts: [{ text }] },
    taskType,
  });

  return result.embedding.values;
}

/**
 * Checks if the Gemini AI client is properly initialized and ready to use.
 *
 * @returns {boolean} True if the client is initialized and API key is present
 */
function isGeminiAvailable() {
  return !!genAI && !!process.env.GEMINI_API_KEY;
}

module.exports = {
  genAI,
  getGenerativeModel,
  getEmbeddingModel,
  generateEmbedding,
  isGeminiAvailable,
  SYSTEM_PROMPT,
  GENERATION_CONFIG,
  SAFETY_SETTINGS,
};
