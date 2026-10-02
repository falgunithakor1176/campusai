'use strict';

/**
 * EmbeddingService — Phase 6B.2A
 *
 * Responsible for generating, storing, and managing vector embeddings
 * for DocumentChunk records using Google Gemini text-embedding-004.
 *
 * Uses the v1 REST API directly (not v1beta SDK default) so that
 * text-embedding-004 is available.
 *
 * Features:
 *  - Configurable batch size
 *  - Exponential backoff with jitter on rate-limit / transient errors
 *  - Incremental indexing (skip already-embedded chunks)
 *  - Force re-index support
 *  - Per-chunk and per-document embeddingStatus tracking
 *  - DocumentProcessingJob progress tracking
 *  - HNSW index creation / verification
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL     = 'models/gemini-embedding-001';
const EMBEDDING_DIM       = 768;
const DEFAULT_BATCH_SIZE  = parseInt(process.env.EMBEDDING_BATCH_SIZE || '10', 10);
const MAX_RETRIES         = 5;
const BASE_DELAY_MS       = 1000;  // 1 s base for exponential backoff
const MAX_DELAY_MS        = 32000; // 32 s cap
const MAX_CONTENT_CHARS   = 8000;  // Gemini token limit safety buffer

// ─── Gemini REST helper ───────────────────────────────────────────────────────

/**
 * Call the Gemini v1 batchEmbedContents endpoint.
 * Returns an array of float arrays, one per input text.
 *
 * @param {string[]} texts
 * @param {string} apiKey
 * @returns {Promise<number[][]>}
 */
async function callGeminiBatchEmbed(texts, apiKey) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;

  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: EMBEDDING_MODEL,
      content: { parts: [{ text: text.slice(0, MAX_CONTENT_CHARS) }] },
      outputDimensionality: EMBEDDING_DIM,
    })),
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Gemini API ${res.status}: ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data.embeddings || data.embeddings.length !== texts.length) {
    throw new Error(`Unexpected response: got ${data.embeddings?.length} embeddings for ${texts.length} inputs`);
  }

  return data.embeddings.map((e) => e.values);
}

/**
 * Retry wrapper with exponential backoff + jitter.
 * Retries on 429 (rate limit) and 5xx errors.
 */
async function withRetry(fn, context = '', maxRetries = MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isRetryable =
        err.status === 429 ||
        err.status === 500 ||
        err.status === 503 ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('fetch failed');

      if (!isRetryable || attempt > maxRetries) {
        logger.error(`❌ ${context} failed after ${attempt} attempts`, { error: err.message });
        throw err;
      }

      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000, MAX_DELAY_MS);
      logger.warn(`⚠️  ${context} attempt ${attempt}/${maxRetries} failed (${err.message}), retrying in ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── EmbeddingService class ───────────────────────────────────────────────────

class EmbeddingService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.batchSize = DEFAULT_BATCH_SIZE;
  }

  /**
   * Ensure the Gemini API key is configured.
   */
  _requireApiKey() {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Set it in .env');
    }
  }

  // ─── HNSW Index ──────────────────────────────────────────────────────────

  /**
   * Create an HNSW index on document_chunks.embedding for cosine similarity.
   * Idempotent — safe to call multiple times.
   */
  async ensureHnswIndex() {
    logger.info('🔍 Verifying HNSW index on document_chunks.embedding...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);
      logger.info('✅ HNSW index ready (vector_cosine_ops, m=16, ef_construction=64)');
      return true;
    } catch (err) {
      logger.warn('⚠️  Could not create HNSW index (may already exist or table is empty):', err.message);
      return false;
    }
  }

  /**
   * Verify the HNSW index exists.
   */
  async verifyHnswIndex() {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'document_chunks'
        AND indexname = 'document_chunks_embedding_hnsw_idx'
    `);
    return rows.length > 0 ? rows[0] : null;
  }

  // ─── Chunk Queries ────────────────────────────────────────────────────────

  /**
   * Get chunks that need embedding.
   * @param {string|null} documentId - null = all documents
   * @param {boolean} force - ignore existing embeddings
   */
  async getChunksToEmbed(documentId = null, force = false) {
    let where = 'WHERE 1=1';
    const params = [];

    if (documentId) {
      params.push(documentId);
      where += ` AND dc."documentId" = $${params.length}`;
    }

    if (!force) {
      where += ` AND (dc.embedding IS NULL)`;
    }

    const sql = `
      SELECT dc.id, dc."documentId", dc."chunkIndex", dc.content,
             dc."pageNumber", dc."sectionTitle", dc.heading,
             dc."tokenCount", dc.metadata,
             d.title as "documentTitle"
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      ${where}
      ORDER BY dc."documentId", dc."chunkIndex"
    `;

    return prisma.$queryRawUnsafe(sql, ...params);
  }

  /**
   * Store a single embedding vector.
   */
  async storeEmbedding(chunkId, vector) {
    const vectorStr = `[${vector.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE document_chunks SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      chunkId
    );
  }

  /**
   * Update embeddingStatus on Document record.
   */
  async updateDocumentEmbeddingStatus(documentId, status, indexedAt = false) {
    const now = new Date();
    if (indexedAt) {
      await prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: status, indexedAt: now, lastIndexedAt: now },
      });
    } else {
      await prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: status },
      });
    }
  }

  // ─── Processing Job Helpers ───────────────────────────────────────────────

  async createJob(documentId, jobType = 'GENERATE_EMBEDDINGS') {
    return prisma.documentProcessingJob.create({
      data: { documentId, jobType, status: 'QUEUED', priority: 1 },
    });
  }

  async startJob(jobId) {
    return prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
    });
  }

  async completeJob(jobId, result = {}) {
    return prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date(), result },
    });
  }

  async failJob(jobId, errorMessage, result = {}) {
    return prisma.documentProcessingJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', completedAt: new Date(), errorMessage, result },
    });
  }

  // ─── Core Indexing ────────────────────────────────────────────────────────

  /**
   * Embed a single batch of chunks (up to batchSize texts).
   * Returns { embedded: number, failed: ChunkError[] }
   */
  async _embedBatch(chunks) {
    const texts  = chunks.map((c) => c.content);
    const vectors = await withRetry(
      () => callGeminiBatchEmbed(texts, this.apiKey),
      `batch[${chunks.length} chunks]`
    );

    let embedded = 0;
    const failed = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        await this.storeEmbedding(chunks[i].id, vectors[i]);
        embedded++;
      } catch (err) {
        failed.push({ chunk: chunks[i], error: err.message });
      }
    }

    return { embedded, failed };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Index all chunks for a single document.
   *
   * @param {string} documentId
   * @param {{ force?: boolean, jobId?: string|null }} options
   * @returns {Promise<IndexResult>}
   */
  async indexDocument(documentId, { force = false, jobId = null } = {}) {
    this._requireApiKey();

    const startTime = Date.now();
    const stats = { total: 0, embedded: 0, skipped: 0, failed: 0, errors: [] };

    // Create a job if one wasn't passed in
    let ownJob = false;
    if (!jobId) {
      const job = await this.createJob(documentId, 'GENERATE_EMBEDDINGS');
      jobId = job.id;
      ownJob = true;
    }

    await this.startJob(jobId);

    try {
      await this.updateDocumentEmbeddingStatus(documentId, 'PROCESSING');

      const chunks = await this.getChunksToEmbed(documentId, force);
      stats.total = chunks.length;

      if (chunks.length === 0) {
        stats.skipped = await this._countExistingEmbeddings(documentId);
        logger.info(`⏩ Document ${documentId}: all chunks already embedded, skipping`);
        await this.updateDocumentEmbeddingStatus(documentId, 'COMPLETED', true);
        await this.completeJob(jobId, { ...stats, durationMs: Date.now() - startTime });
        return stats;
      }

      logger.info(`📐 Indexing document ${documentId}: ${chunks.length} chunks in batches of ${this.batchSize}`);

      // Process in batches
      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + this.batchSize);
        const batchNum = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(chunks.length / this.batchSize);

        logger.info(`  Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

        try {
          const result = await this._embedBatch(batch);
          stats.embedded += result.embedded;
          stats.failed   += result.failed.length;
          stats.errors.push(...result.failed.map((f) => ({ chunkId: f.chunk.id, error: f.error })));
        } catch (err) {
          // Entire batch failed
          stats.failed  += batch.length;
          stats.errors.push(...batch.map((c) => ({ chunkId: c.id, error: err.message })));
          logger.error(`  ❌ Batch ${batchNum} failed: ${err.message}`);
        }

        // Small inter-batch delay to be kind to rate limits
        if (i + this.batchSize < chunks.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Update document status
      const finalStatus = stats.failed === 0 ? 'COMPLETED' : (stats.embedded === 0 ? 'FAILED' : 'COMPLETED');
      await this.updateDocumentEmbeddingStatus(documentId, finalStatus, stats.embedded > 0);

      const durationMs = Date.now() - startTime;
      await this.completeJob(jobId, { ...stats, durationMs });

      return { ...stats, durationMs };
    } catch (err) {
      await this.updateDocumentEmbeddingStatus(documentId, 'FAILED');
      if (ownJob) await this.failJob(jobId, err.message, stats);
      throw err;
    }
  }

  /**
   * Index ALL documents — only unembedded chunks unless force=true.
   *
   * @param {{ force?: boolean, batchSize?: number }} options
   * @returns {Promise<GlobalIndexResult>}
   */
  async indexAll({ force = false, batchSize = null } = {}) {
    this._requireApiKey();

    if (batchSize) this.batchSize = batchSize;

    const startTime = Date.now();
    const globalStats = {
      totalDocuments: 0,
      processedDocuments: 0,
      totalChunks: 0,
      embedded: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      perDocument: [],
    };

    // Ensure HNSW index before starting
    await this.ensureHnswIndex();

    // Get all documents with chunks
    const docs = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT d.id, d.title, d."embeddingStatus", COUNT(dc.id) as chunk_count
      FROM documents d
      JOIN document_chunks dc ON dc."documentId" = d.id
      WHERE d."deletedAt" IS NULL
      GROUP BY d.id, d.title, d."embeddingStatus"
      ORDER BY d.title
    `);

    globalStats.totalDocuments = docs.length;

    logger.info('═══════════════════════════════════════════════════');
    logger.info('  CampusAI — AI Indexing Pipeline (Phase 6B.2A)  ');
    logger.info('═══════════════════════════════════════════════════');
    logger.info(`📚 Documents to process: ${docs.length}`);
    logger.info(`🔄 Force re-index: ${force}`);
    logger.info(`📦 Batch size: ${this.batchSize}`);
    logger.info('');

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const progress = `[${i + 1}/${docs.length}]`;

      // Skip if already completed and not forced
      if (!force && doc.embeddingStatus === 'COMPLETED') {
        logger.info(`${progress} ⏩ Skipping "${doc.title}" (already indexed)`);
        globalStats.skipped += parseInt(doc.chunk_count);
        globalStats.perDocument.push({ id: doc.id, title: doc.title, status: 'SKIPPED', chunks: 0 });
        continue;
      }

      logger.info(`${progress} 🔄 Indexing: "${doc.title}"`);

      try {
        const job = await this.createJob(doc.id, 'GENERATE_EMBEDDINGS');
        const result = await this.indexDocument(doc.id, { force, jobId: job.id });

        globalStats.embedded     += result.embedded;
        globalStats.failed       += result.failed;
        globalStats.totalChunks  += result.total;
        globalStats.processedDocuments++;

        if (result.errors.length > 0) globalStats.errors.push(...result.errors);

        globalStats.perDocument.push({
          id: doc.id,
          title: doc.title,
          status: result.failed === 0 ? 'COMPLETED' : 'PARTIAL',
          chunksEmbedded: result.embedded,
          chunksFailed: result.failed,
          durationMs: result.durationMs,
        });

        logger.info(`  ✅ Done — ${result.embedded} embedded, ${result.failed} failed, ${result.durationMs}ms`);
      } catch (err) {
        globalStats.failed++;
        globalStats.perDocument.push({ id: doc.id, title: doc.title, status: 'FAILED', error: err.message });
        logger.error(`  ❌ Failed: ${err.message}`);
      }
    }

    const totalMs = Date.now() - startTime;
    globalStats.totalDurationMs = totalMs;
    globalStats.avgEmbeddingMs  = globalStats.embedded > 0
      ? Math.round(totalMs / globalStats.embedded)
      : 0;

    return globalStats;
  }

  /**
   * Re-index a single document (always force).
   */
  async reindexDocument(documentId) {
    return this.indexDocument(documentId, { force: true });
  }

  /**
   * Retry all FAILED embedding jobs.
   */
  async retryFailed() {
    const failedDocs = await prisma.document.findMany({
      where: { embeddingStatus: 'FAILED', deletedAt: null },
      select: { id: true, title: true },
    });

    logger.info(`🔁 Retrying ${failedDocs.length} failed documents...`);
    const results = [];
    for (const doc of failedDocs) {
      try {
        const result = await this.indexDocument(doc.id, { force: true });
        results.push({ id: doc.id, title: doc.title, ...result });
      } catch (err) {
        results.push({ id: doc.id, title: doc.title, error: err.message });
      }
    }
    return results;
  }

  // ─── Stats / Verification ─────────────────────────────────────────────────

  async _countExistingEmbeddings(documentId) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM document_chunks WHERE "documentId" = $1 AND embedding IS NOT NULL`,
      documentId
    );
    return parseInt(rows[0].cnt);
  }

  /**
   * Generate a 768-dimensional embedding vector for a single text (e.g., user search query).
   * Uses exponential backoff and outputDimensionality: 768 to match pgvector HNSW schema.
   *
   * @param {string} text
   * @returns {Promise<number[]>} 768-dimensional float array
   */
  async embedText(text) {
    this._requireApiKey();
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text to embed cannot be empty');
    }
    const vectors = await withRetry(
      () => callGeminiBatchEmbed([text.trim()], this.apiKey),
      `embedText`
    );
    return vectors[0];
  }

  /**
   * Return a full verification report.
   */
  async getVerificationReport() {
    const [totalChunks] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM document_chunks`
    );
    const [embeddedChunks] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM document_chunks WHERE embedding IS NOT NULL`
    );
    const [failedChunks] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM document_chunks WHERE embedding IS NULL`
    );

    const hnswIndex = await this.verifyHnswIndex();

    const docStats = await prisma.$queryRawUnsafe(`
      SELECT "embeddingStatus", COUNT(*) as cnt
      FROM documents
      WHERE "deletedAt" IS NULL
      GROUP BY "embeddingStatus"
    `);

    const jobStats = await prisma.$queryRawUnsafe(`
      SELECT status, COUNT(*) as cnt
      FROM document_processing_jobs
      WHERE "jobType" = 'GENERATE_EMBEDDINGS'
      GROUP BY status
    `);

    return {
      chunks: {
        total: parseInt(totalChunks.cnt),
        embedded: parseInt(embeddedChunks.cnt),
        pending: parseInt(failedChunks.cnt),
      },
      documents: docStats.reduce((acc, r) => {
        acc[r.embeddingStatus] = parseInt(r.cnt);
        return acc;
      }, {}),
      jobs: jobStats.reduce((acc, r) => {
        acc[r.status] = parseInt(r.cnt);
        return acc;
      }, {}),
      hnswIndex: hnswIndex
        ? { exists: true, name: hnswIndex.indexname, def: hnswIndex.indexdef }
        : { exists: false },
    };
  }
}

// Export singleton
module.exports = new EmbeddingService();
