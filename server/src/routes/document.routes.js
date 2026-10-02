'use strict';

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');
const { uploadPdf } = require('../middleware/upload.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const documentController = require('../controllers/document.controller');
const retrievalController = require('../controllers/retrieval.controller');
const documentSchema = require('../schemas/document.schema');

router.use(authenticate);

// ─── Collection routes (MUST come before /:id to avoid shadowing) ─────────────

// POST & GET /api/documents/search — Phase 6B.2B Vector Search
router.post('/search', asyncHandler(retrievalController.search));
router.get('/search', asyncHandler(retrievalController.search));

router.post(
  '/',
  uploadLimiter,
  uploadPdf,
  validate(documentSchema.uploadSchema),
  asyncHandler(documentController.upload)
);

router.get(
  '/',
  validateQuery(documentSchema.listSchema),
  asyncHandler(documentController.list)
);

// /stats must be defined BEFORE /:id — otherwise Express matches "stats" as an ID
router.get(
  '/stats',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(documentController.getStats)
);

// ─── Phase 6B.2A — Indexing routes (all before /:id to avoid shadowing) ───────

// GET  /api/documents/index/status     — verification report
router.get(
  '/index/status',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(documentController.getIndexingStatus)
);

// POST /api/documents/index-all        — embed all pending chunks
router.post(
  '/index-all',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(documentController.indexAll)
);

// POST /api/documents/index/retry-failed — retry FAILED documents
router.post(
  '/index/retry-failed',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(documentController.retryFailed)
);

// ─── Resource routes ───────────────────────────────────────────────────────────

router.get('/:id', asyncHandler(documentController.getById));

router.get('/:id/download', asyncHandler(documentController.download));

router.put(
  '/:id',
  uploadPdf,
  validate(documentSchema.updateSchema),
  asyncHandler(documentController.update)
);

router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(documentController.softDelete));

router.post('/:id/restore', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(documentController.restore));

router.get('/:id/versions', asyncHandler(documentController.getVersionHistory));

router.get('/:id/audit', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(documentController.getAuditLog));

// POST /api/documents/:id/index — index a single document's chunks
router.post('/:id/index', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(documentController.indexDocument));

module.exports = router;

