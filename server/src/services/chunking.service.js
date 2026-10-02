/**
 * Semantic Chunking Service
 *
 * Splits extracted document text into semantic chunks suitable for
 * future embedding generation and RAG retrieval.
 *
 * Chunking strategy:
 * - Target size: 500–800 tokens per chunk
 * - Overlap: ~100 tokens between consecutive chunks
 * - Preserves section headings and hierarchy
 * - Tracks page numbers, section titles, and heading context
 *
 * Token estimation uses word count × 1.3 (standard approximation for
 * English text with subword tokenizers like GPT/Gemini).
 *
 * @module services/chunking.service
 */

'use strict';

const documentRepository = require('../repositories/document.repository');
const logger = require('../config/logger');

// Token estimation: ~1.3 tokens per word for English text
const TOKENS_PER_WORD = 1.3;
const MIN_CHUNK_TOKENS = 500;
const MAX_CHUNK_TOKENS = 800;
const OVERLAP_TOKENS = 100;

class ChunkingService {
  /**
   * Chunks a processed document and stores chunks in the database.
   *
   * @param {string} documentId - The document ID
   * @param {Object} structuredContent - Output from DocumentProcessingService
   * @returns {Promise<Object>} Chunking result with statistics
   */
  async chunkDocument(documentId, structuredContent) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Create processing job for chunking
    const job = await documentRepository.createProcessingJob({
      documentId,
      jobType: 'GENERATE_CHUNKS',
      status: 'RUNNING',
      startedAt: new Date()
    });

    try {
      logger.info('🔪 Starting semantic chunking', {
        documentId,
        title: doc.title,
        totalPages: structuredContent.totalPages
      });

      // Delete existing chunks for this document (re-chunking)
      await documentRepository.deleteChunksByDocumentId(documentId);

      // Build chunks from structured content
      const chunks = this._buildChunks(structuredContent);

      // Prepare chunk records for database
      const chunkRecords = chunks.map((chunk, index) => ({
        documentId,
        chunkIndex: index,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        pageNumber: chunk.pageNumber,
        sectionTitle: chunk.sectionTitle || null,
        heading: chunk.heading || null,
        metadata: {
          startPage: chunk.startPage,
          endPage: chunk.endPage,
          charCount: chunk.content.length,
          wordCount: chunk.wordCount,
          headingHierarchy: chunk.headingHierarchy || []
        }
      }));

      // Batch insert chunks
      if (chunkRecords.length > 0) {
        await documentRepository.createChunks(chunkRecords);
      }

      // Update document chunk count
      await documentRepository.updateChunkCount(documentId, chunkRecords.length);

      // Update processing job
      await documentRepository.updateProcessingJob(job.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: {
          totalChunks: chunkRecords.length,
          avgTokensPerChunk: chunkRecords.length > 0
            ? Math.round(chunkRecords.reduce((s, c) => s + c.tokenCount, 0) / chunkRecords.length)
            : 0,
          minTokens: chunkRecords.length > 0
            ? Math.min(...chunkRecords.map(c => c.tokenCount))
            : 0,
          maxTokens: chunkRecords.length > 0
            ? Math.max(...chunkRecords.map(c => c.tokenCount))
            : 0
        }
      });

      logger.info('✅ Semantic chunking completed', {
        documentId,
        totalChunks: chunkRecords.length,
        avgTokensPerChunk: chunkRecords.length > 0
          ? Math.round(chunkRecords.reduce((s, c) => s + c.tokenCount, 0) / chunkRecords.length)
          : 0
      });

      return {
        documentId,
        totalChunks: chunkRecords.length,
        chunks: chunkRecords.map(c => ({
          index: c.chunkIndex,
          tokenCount: c.tokenCount,
          pageNumber: c.pageNumber,
          sectionTitle: c.sectionTitle,
          heading: c.heading
        }))
      };
    } catch (error) {
      logger.error('❌ Chunking failed', {
        documentId,
        error: error.message
      });

      await documentRepository.updateProcessingJob(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * Builds semantic chunks from structured document content.
   * Uses a sliding window approach with heading-aware boundaries.
   *
   * @param {Object} structuredContent - Output from processing service
   * @returns {Array<Object>} Array of chunk objects
   * @private
   */
  _buildChunks(structuredContent) {
    const { pages, sections } = structuredContent;
    const chunks = [];

    // Build a flat sequence of text blocks with metadata
    const blocks = this._buildTextBlocks(pages, sections);

    if (blocks.length === 0) return chunks;

    // Sliding window chunking with overlap
    let currentChunk = {
      content: '',
      wordCount: 0,
      tokenCount: 0,
      startPage: blocks[0].pageNumber,
      endPage: blocks[0].pageNumber,
      pageNumber: blocks[0].pageNumber,
      sectionTitle: blocks[0].sectionTitle,
      heading: blocks[0].heading,
      headingHierarchy: blocks[0].headingHierarchy || []
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockWords = this._countWords(block.text);
      const blockTokens = Math.round(blockWords * TOKENS_PER_WORD);

      // If adding this block would exceed max and we already have enough content
      if (
        currentChunk.tokenCount + blockTokens > MAX_CHUNK_TOKENS &&
        currentChunk.tokenCount >= MIN_CHUNK_TOKENS
      ) {
        // Save current chunk
        chunks.push({ ...currentChunk });

        // Start new chunk with overlap from previous content
        const overlapText = this._getOverlapText(currentChunk.content, OVERLAP_TOKENS);
        currentChunk = {
          content: overlapText,
          wordCount: this._countWords(overlapText),
          tokenCount: Math.round(this._countWords(overlapText) * TOKENS_PER_WORD),
          startPage: block.pageNumber,
          endPage: block.pageNumber,
          pageNumber: block.pageNumber,
          sectionTitle: block.sectionTitle || currentChunk.sectionTitle,
          heading: block.heading || currentChunk.heading,
          headingHierarchy: block.headingHierarchy || currentChunk.headingHierarchy
        };
      }

      // If a new heading appears and chunk has content, consider splitting
      if (
        block.heading &&
        block.heading !== currentChunk.heading &&
        currentChunk.tokenCount >= MIN_CHUNK_TOKENS
      ) {
        chunks.push({ ...currentChunk });

        const overlapText = this._getOverlapText(currentChunk.content, OVERLAP_TOKENS);
        currentChunk = {
          content: overlapText,
          wordCount: this._countWords(overlapText),
          tokenCount: Math.round(this._countWords(overlapText) * TOKENS_PER_WORD),
          startPage: block.pageNumber,
          endPage: block.pageNumber,
          pageNumber: block.pageNumber,
          sectionTitle: block.sectionTitle,
          heading: block.heading,
          headingHierarchy: block.headingHierarchy || []
        };
      }

      // Append block to current chunk
      if (currentChunk.content.length > 0) {
        currentChunk.content += '\n\n' + block.text;
      } else {
        currentChunk.content = block.text;
      }
      currentChunk.wordCount += blockWords;
      currentChunk.tokenCount += blockTokens;
      currentChunk.endPage = block.pageNumber;

      // Update heading context if block has one
      if (block.heading) {
        currentChunk.heading = block.heading;
      }
      if (block.sectionTitle) {
        currentChunk.sectionTitle = block.sectionTitle;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.content.trim().length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Builds a flat array of text blocks from pages and sections,
   * preserving structural metadata.
   *
   * @param {Array} pages - Array of page objects
   * @param {Array} sections - Array of section objects
   * @returns {Array<Object>} Array of text block objects
   * @private
   */
  _buildTextBlocks(pages, sections) {
    const blocks = [];

    for (const page of pages) {
      if (!page.cleanedText || page.cleanedText.trim().length === 0) continue;

      // Split page text into paragraphs
      const paragraphs = page.cleanedText
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 10);

      // Find which section this page belongs to
      const pageSection = sections.find(
        s => page.pageNumber >= s.startPage && page.pageNumber <= s.endPage
      );

      // Find the heading context for this page
      const pageHeading = page.headings.length > 0
        ? page.headings[0].text
        : null;

      for (const para of paragraphs) {
        blocks.push({
          text: para,
          pageNumber: page.pageNumber,
          sectionTitle: pageSection ? pageSection.title : null,
          heading: pageHeading,
          headingHierarchy: page.headings.map(h => h.text)
        });
      }
    }

    return blocks;
  }

  /**
   * Extracts the last N tokens worth of text for overlap.
   *
   * @param {string} text - The source text
   * @param {number} overlapTokens - Number of tokens to overlap
   * @returns {string} The overlap text
   * @private
   */
  _getOverlapText(text, overlapTokens) {
    const words = text.split(/\s+/);
    const overlapWords = Math.round(overlapTokens / TOKENS_PER_WORD);
    const startIdx = Math.max(0, words.length - overlapWords);
    return words.slice(startIdx).join(' ');
  }

  /**
   * Counts words in a text string.
   *
   * @param {string} text - The text to count words in
   * @returns {number} Word count
   * @private
   */
  _countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Estimates the token count for a text string.
   *
   * @param {string} text - The text to estimate tokens for
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    return Math.round(this._countWords(text) * TOKENS_PER_WORD);
  }
}

module.exports = new ChunkingService();
