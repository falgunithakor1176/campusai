'use strict';

/**
 * RetrievalService — Phase 6B.2B
 *
 * Enterprise Vector Search & Retrieval Engine for CampusAI Knowledge Base.
 * Leverages PostgreSQL pgvector HNSW index and Google Gemini 768-dim embeddings
 * to perform semantic similarity search over DocumentChunk records.
 *
 * Features:
 *  - Cosine similarity vector search (pgvector `<=>` operator)
 *  - Live query embedding via EmbeddingService (`models/gemini-embedding-001`)
 *  - Citation-ready metadata formatting (Document Title, Page, Section, Chunk ID, Similarity Score)
 *  - Multi-tenant isolation (`collegeId`)
 *  - Role-Based Access Control (RBAC) visibility filtering (`PUBLIC`, `STUDENTS`, `FACULTY`, `ADMIN`, `PRIVATE`)
 *  - Flexible metadata filtering (`category`, `documentId`, `minSimilarity`, `limit`)
 *  - Related chunk discovery (`getSimilarChunks`)
 */

const { PrismaClient } = require('@prisma/client');
const embeddingService = require('./embedding.service');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class RetrievalService {
  /**
   * Perform semantic vector search over the DocumentChunk repository.
   *
   * @param {string} queryText - The user search query.
   * @param {Object} options - Search options and filters.
   * @param {number} [options.topK=5] - Maximum number of chunks to return (1 to 50).
   * @param {number} [options.minSimilarity=0.25] - Minimum cosine similarity threshold (0.0 to 1.0).
   * @param {string|string[]} [options.category] - Filter by document category or categories.
   * @param {string|string[]} [options.visibility] - Filter by explicit visibility or visibilities.
   * @param {string} [options.documentId] - Filter by specific parent document ID.
   * @param {string} [options.collegeId] - Filter by college ID (multi-tenant enforcement).
   * @param {Object} [options.user] - Current user for RBAC enforcement (role, userId).
   * @param {boolean} [options.enforceRbac=true] - Whether to enforce RBAC rules based on `options.user`.
   * @returns {Promise<Array<CitationChunk>>} Ranked array of citation-ready chunks.
   */
  async search(queryText, options = {}) {
    if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
      throw new Error('Search query cannot be empty');
    }

    const topK = Math.min(Math.max(parseInt(options.topK || options.limit || '5', 10), 1), 50);
    const minSimilarity = parseFloat(options.minSimilarity !== undefined ? options.minSimilarity : 0.25);

    logger.debug(`🔍 Vector search request: "${queryText}"`, { topK, minSimilarity, ...options });

    // 1. Generate embedding for query text
    const queryVector = await embeddingService.embedText(queryText.trim());
    const vectorStr = `[${queryVector.join(',')}]`;

    // 2. Build SQL parameters and WHERE clauses
    const params = [vectorStr]; // $1 is query vector string
    const whereClauses = [
      `d."deletedAt" IS NULL`,
      `d.status = 'READY'`,
      `dc.embedding IS NOT NULL`,
    ];

    // Multi-tenant college filter
    if (options.collegeId) {
      params.push(options.collegeId);
      whereClauses.push(`d."collegeId" = $${params.length}`);
    }

    // Specific document filter
    if (options.documentId) {
      params.push(options.documentId);
      whereClauses.push(`dc."documentId" = $${params.length}`);
    }

    // Category filter
    if (options.category) {
      const categories = Array.isArray(options.category) ? options.category : [options.category];
      if (categories.length > 0) {
        const placeholders = categories.map((cat) => {
          params.push(cat);
          return `$${params.length}`;
        });
        whereClauses.push(`d.category::text IN (${placeholders.join(', ')})`);
      }
    }

    // RBAC & Visibility enforcement
    if (options.enforceRbac !== false) {
      const user = options.user;
      if (!user) {
        // Unauthenticated guest: can only see PUBLIC documents
        whereClauses.push(`d.visibility::text = 'PUBLIC'`);
      } else {
        const role = user.role;
        const userId = user.userId || user.id;

        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          // Admins can see all visibilities within their college
          if (options.visibility) {
            const visList = Array.isArray(options.visibility) ? options.visibility : [options.visibility];
            const placeholders = visList.map((v) => {
              params.push(v);
              return `$${params.length}`;
            });
            whereClauses.push(`d.visibility::text IN (${placeholders.join(', ')})`);
          }
        } else if (role === 'FACULTY') {
          params.push(userId);
          const uidParam = `$${params.length}`;
          whereClauses.push(`(
            d.visibility::text IN ('PUBLIC', 'STUDENTS', 'FACULTY') OR 
            (d.visibility::text = 'PRIVATE' AND d."uploadedById" = ${uidParam})
          )`);
        } else {
          // STUDENT or default
          params.push(userId);
          const uidParam = `$${params.length}`;
          whereClauses.push(`(
            d.visibility::text IN ('PUBLIC', 'STUDENTS') OR 
            (d.visibility::text = 'PRIVATE' AND d."uploadedById" = ${uidParam})
          )`);
        }
      }
    } else if (options.visibility) {
      // Explicit visibility without RBAC override
      const visList = Array.isArray(options.visibility) ? options.visibility : [options.visibility];
      const placeholders = visList.map((v) => {
        params.push(v);
        return `$${params.length}`;
      });
      whereClauses.push(`d.visibility::text IN (${placeholders.join(', ')})`);
    }

    // Add minSimilarity threshold and topK limit parameters
    params.push(minSimilarity);
    const minSimParam = `$${params.length}`;

    params.push(topK);
    const topKParam = `$${params.length}`;

    // 3. Assemble and execute query using pgvector <=> (cosine distance)
    const sql = `
      SELECT 
        dc.id as "chunkId",
        dc."documentId",
        dc."chunkIndex",
        dc.content,
        dc."pageNumber",
        dc."sectionTitle",
        dc.heading,
        dc."tokenCount",
        dc.metadata as "chunkMetadata",
        d.title as "documentTitle",
        d.category,
        d.visibility,
        d."fileName",
        ROUND((1 - (dc.embedding <=> $1::vector))::numeric, 4) as "similarityScore"
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE ${whereClauses.join(' AND ')}
        AND (1 - (dc.embedding <=> $1::vector)) >= ${minSimParam}
      ORDER BY dc.embedding <=> $1::vector ASC
      LIMIT ${topKParam}
    `;

    const startTime = Date.now();
    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    const durationMs = Date.now() - startTime;

    logger.info(`✅ Vector search completed in ${durationMs}ms: found ${rows.length} relevant chunks`);

    // 4. Format into clean, citation-ready objects
    return rows.map((row) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      documentTitle: row.documentTitle,
      pageNumber: row.pageNumber || 1,
      sectionTitle: row.sectionTitle || 'General',
      heading: row.heading || row.sectionTitle || row.documentTitle,
      content: row.content,
      similarityScore: parseFloat(row.similarityScore),
      category: row.category,
      visibility: row.visibility,
      chunkIndex: row.chunkIndex,
      tokenCount: row.tokenCount,
    }));
  }

  /**
   * Search for relevant chunks restricted to a specific document.
   *
   * @param {string} queryText
   * @param {string} documentId
   * @param {Object} [options={}]
   * @returns {Promise<Array<CitationChunk>>}
   */
  async searchByDocument(queryText, documentId, options = {}) {
    return this.search(queryText, { ...options, documentId });
  }

  /**
   * Search for relevant chunks within a specific document category (e.g. 'FEES', 'ADMISSION').
   *
   * @param {string} queryText
   * @param {string|string[]} category
   * @param {Object} [options={}]
   * @returns {Promise<Array<CitationChunk>>}
   */
  async searchByCategory(queryText, category, options = {}) {
    return this.search(queryText, { ...options, category });
  }

  /**
   * Find chunks that are semantically similar to an existing chunk by its ID.
   * Useful for "See Related Sections" or knowledge graph exploration.
   *
   * @param {string} chunkId - Target chunk ID to compare against.
   * @param {number} [topK=5] - Number of similar chunks to return.
   * @param {number} [minSimilarity=0.3] - Minimum similarity threshold.
   * @returns {Promise<Array<CitationChunk>>}
   */
  async getSimilarChunks(chunkId, topK = 5, minSimilarity = 0.3) {
    // Check target chunk exists and has embedding
    const targetChunks = await prisma.$queryRawUnsafe(
      `SELECT id, "documentId", embedding::text as vector_str FROM document_chunks WHERE id = $1 AND embedding IS NOT NULL`,
      chunkId
    );

    if (targetChunks.length === 0) {
      throw new Error(`Chunk ${chunkId} not found or has no embedding vector`);
    }

    const target = targetChunks[0];
    const vectorStr = target.vector_str;

    const sql = `
      SELECT 
        dc.id as "chunkId",
        dc."documentId",
        dc."chunkIndex",
        dc.content,
        dc."pageNumber",
        dc."sectionTitle",
        dc.heading,
        dc."tokenCount",
        d.title as "documentTitle",
        d.category,
        d.visibility,
        ROUND((1 - (dc.embedding <=> $1::vector))::numeric, 4) as "similarityScore"
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE dc.id != $2
        AND dc.embedding IS NOT NULL
        AND d."deletedAt" IS NULL
        AND d.status = 'READY'
        AND (1 - (dc.embedding <=> $1::vector)) >= $3
      ORDER BY dc.embedding <=> $1::vector ASC
      LIMIT $4
    `;

    const rows = await prisma.$queryRawUnsafe(sql, vectorStr, chunkId, minSimilarity, topK);

    return rows.map((row) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      documentTitle: row.documentTitle,
      pageNumber: row.pageNumber || 1,
      sectionTitle: row.sectionTitle || 'General',
      heading: row.heading || row.sectionTitle || row.documentTitle,
      content: row.content,
      similarityScore: parseFloat(row.similarityScore),
      category: row.category,
      visibility: row.visibility,
      chunkIndex: row.chunkIndex,
      tokenCount: row.tokenCount,
    }));
  }
}

module.exports = new RetrievalService();
