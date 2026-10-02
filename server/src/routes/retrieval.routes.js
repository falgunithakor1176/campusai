'use strict';

/**
 * Retrieval Routes - Phase 6B.2B
 *
 * Vector Similarity Search API endpoints for knowledge retrieval and ranking.
 * Uses authenticateOptional so both authenticated users and public guests
 * can search (with automatic RBAC visibility filtering applied downstream).
 *
 * OpenAPI documentation is defined in swagger.js (definition.paths).
 */

const express = require('express');
const router = express.Router();
const retrievalController = require('../controllers/retrieval.controller');
const { authenticateOptional } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

router.use(authenticateOptional);

// POST & GET /api/retrieval/search - Semantic vector search across all chunks
router.post('/search', asyncHandler(retrievalController.search));
router.get('/search', asyncHandler(retrievalController.search));

// POST /api/retrieval/document/:documentId/search - Search within a specific document
router.post('/document/:documentId/search', asyncHandler(retrievalController.searchByDocument));

// POST /api/retrieval/category/:category/search - Search within a specific category
router.post('/category/:category/search', asyncHandler(retrievalController.searchByCategory));

// GET /api/retrieval/similar/:chunkId - Find chunks similar to target chunk
router.get('/similar/:chunkId', asyncHandler(retrievalController.getSimilarChunks));

module.exports = router;
