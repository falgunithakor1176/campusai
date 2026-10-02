'use strict';

const documentService  = require('../services/document.service');
const embeddingService = require('../services/embedding.service');
const ApiResponse      = require('../utils/apiResponse');
const logger           = require('../config/logger');

const upload = async (req, res) => {
  const doc = await documentService.upload(req.file, req.body, req.user);
  return ApiResponse.created(res, doc, 'Document uploaded successfully');
};

const update = async (req, res) => {
  const doc = await documentService.update(req.params.id, req.body, req.file, req.user);
  return ApiResponse.success(res, doc, 'Document updated successfully');
};

const getById = async (req, res) => {
  const doc = await documentService.getById(req.params.id, req.user);
  return ApiResponse.success(res, doc, 'Document retrieved successfully');
};

const list = async (req, res) => {
  const options = {
    ...req.query,
    collegeId: req.user.collegeId,
    role: req.user.role,
    userId: req.user.userId
  };
  const { data, total } = await documentService.list(options);
  const page  = parseInt(req.query.page  || '1',  10);
  const limit = parseInt(req.query.limit || '10', 10);
  return ApiResponse.paginated(res, data, page, limit, total, 'Documents retrieved successfully');
};

const download = async (req, res) => {
  const filePath = await documentService.download(req.params.id, req.user);
  return res.download(filePath);
};

const softDelete = async (req, res) => {
  await documentService.softDelete(req.params.id, req.user);
  return ApiResponse.success(res, null, 'Document deleted successfully');
};

const restore = async (req, res) => {
  await documentService.restore(req.params.id, req.user);
  return ApiResponse.success(res, null, 'Document restored successfully');
};

const getVersionHistory = async (req, res) => {
  const versions = await documentService.getVersions(req.params.id, req.user);
  return ApiResponse.success(res, versions, 'Document versions retrieved successfully');
};

const getAuditLog = async (req, res) => {
  const logs = await documentService.getAuditLogs(req.params.id, req.user);
  return ApiResponse.success(res, logs, 'Document audit logs retrieved successfully');
};

const getStats = async (req, res) => {
  const stats = await documentService.getStats(req.user);
  return ApiResponse.success(res, stats, 'Document stats retrieved successfully');
};

// ─── Phase 6B.2A — Indexing endpoints ────────────────────────────────────────

/**
 * POST /api/documents/:id/index
 * Index (embed) all chunks for a single document.
 * Query: ?force=true to re-embed existing chunks.
 */
const indexDocument = async (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true';
  logger.info(`Index request for document ${id}`, { force, userId: req.user.userId });
  const result = await embeddingService.indexDocument(id, { force });
  return ApiResponse.success(res, {
    documentId: id,
    embedded:   result.embedded,
    skipped:    result.skipped,
    failed:     result.failed,
    durationMs: result.durationMs,
    errors:     result.errors,
  }, `Indexed ${result.embedded} chunks successfully`);
};

/**
 * POST /api/documents/index-all
 * Incrementally embed all documents (skips already-done ones).
 * Query: ?force=true to force re-embed.
 */
const indexAll = async (req, res) => {
  const force     = req.query.force === 'true';
  const batchSize = req.body && req.body.batchSize ? parseInt(req.body.batchSize, 10) : undefined;
  logger.info('Index-all request', { force, batchSize, userId: req.user.userId });
  const result = await embeddingService.indexAll({ force, batchSize });
  return ApiResponse.success(res, result, `Indexed ${result.embedded} chunks across ${result.processedDocuments} documents`);
};

/**
 * POST /api/documents/index/retry-failed
 * Retry all FAILED documents.
 */
const retryFailed = async (req, res) => {
  logger.info('Retry-failed request', { userId: req.user.userId });
  const results = await embeddingService.retryFailed();
  return ApiResponse.success(res, results, `Retried ${results.length} failed documents`);
};

/**
 * GET /api/documents/index/status
 * Return full verification report.
 */
const getIndexingStatus = async (req, res) => {
  const report = await embeddingService.getVerificationReport();
  return ApiResponse.success(res, report, 'Indexing status retrieved');
};

module.exports = {
  upload,
  update,
  getById,
  list,
  download,
  softDelete,
  restore,
  getVersionHistory,
  getAuditLog,
  getStats,
  indexDocument,
  indexAll,
  retryFailed,
  getIndexingStatus,
};
