'use strict';

/**
 * RetrievalController — Phase 6B.2B
 *
 * Handles HTTP requests for Vector Similarity Search, chunk ranking,
 * metadata filtering, and citation formatting.
 */

const retrievalService = require('../services/retrieval.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

/**
 * POST /api/retrieval/search
 * GET  /api/retrieval/search
 *
 * Search across DocumentChunk embeddings using query text and optional filters.
 */
const search = async (req, res) => {
  const queryText = req.body?.query || req.query?.query || req.body?.q || req.query?.q;

  if (!queryText || !queryText.trim()) {
    return ApiResponse.badRequest(res, 'Search query is required (body.query or query.q)');
  }

  const options = {
    topK: req.body?.topK || req.query?.topK || req.body?.limit || req.query?.limit || 5,
    minSimilarity: req.body?.minSimilarity !== undefined ? req.body.minSimilarity : (req.query?.minSimilarity || 0.25),
    category: req.body?.category || req.query?.category,
    visibility: req.body?.visibility || req.query?.visibility,
    documentId: req.body?.documentId || req.query?.documentId,
    collegeId: req.user?.collegeId,
    user: req.user,
  };

  logger.info(`🔍 Retrieval search controller: "${queryText}"`, { userId: req.user?.userId || 'guest', ...options });

  const startTime = Date.now();
  const results = await retrievalService.search(queryText, options);
  const durationMs = Date.now() - startTime;

  return ApiResponse.success(
    res,
    {
      query: queryText,
      totalResults: results.length,
      topK: parseInt(options.topK, 10),
      durationMs,
      results,
    },
    `Found ${results.length} relevant citation chunks`
  );
};

/**
 * POST /api/retrieval/document/:documentId/search
 *
 * Search restricted to a single parent document.
 */
const searchByDocument = async (req, res) => {
  const { documentId } = req.params;
  const queryText = req.body?.query || req.query?.query || req.body?.q || req.query?.q;

  if (!queryText || !queryText.trim()) {
    return ApiResponse.badRequest(res, 'Search query is required');
  }

  const options = {
    topK: req.body?.topK || req.query?.topK || 5,
    minSimilarity: req.body?.minSimilarity || req.query?.minSimilarity || 0.2,
    collegeId: req.user?.collegeId,
    user: req.user,
  };

  const results = await retrievalService.searchByDocument(queryText, documentId, options);

  return ApiResponse.success(
    res,
    {
      query: queryText,
      documentId,
      totalResults: results.length,
      results,
    },
    `Found ${results.length} relevant chunks in document`
  );
};

/**
 * POST /api/retrieval/category/:category/search
 *
 * Search restricted to a specific category (e.g. 'FEES', 'ADMISSION').
 */
const searchByCategory = async (req, res) => {
  const { category } = req.params;
  const queryText = req.body?.query || req.query?.query || req.body?.q || req.query?.q;

  if (!queryText || !queryText.trim()) {
    return ApiResponse.badRequest(res, 'Search query is required');
  }

  const options = {
    topK: req.body?.topK || req.query?.topK || 5,
    minSimilarity: req.body?.minSimilarity || req.query?.minSimilarity || 0.25,
    collegeId: req.user?.collegeId,
    user: req.user,
  };

  const results = await retrievalService.searchByCategory(queryText, category.toUpperCase(), options);

  return ApiResponse.success(
    res,
    {
      query: queryText,
      category: category.toUpperCase(),
      totalResults: results.length,
      results,
    },
    `Found ${results.length} relevant chunks in category ${category}`
  );
};

/**
 * GET /api/retrieval/similar/:chunkId
 *
 * Find chunks semantically similar to a target chunk ID.
 */
const getSimilarChunks = async (req, res) => {
  const { chunkId } = req.params;
  const topK = parseInt(req.query.topK || '5', 10);
  const minSimilarity = parseFloat(req.query.minSimilarity || '0.3');

  const results = await retrievalService.getSimilarChunks(chunkId, topK, minSimilarity);

  return ApiResponse.success(
    res,
    {
      targetChunkId: chunkId,
      totalResults: results.length,
      results,
    },
    `Found ${results.length} similar chunks`
  );
};

module.exports = {
  search,
  searchByDocument,
  searchByCategory,
  getSimilarChunks,
};
