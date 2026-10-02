'use strict';

/**
 * runIndexer.js — Phase 6B.2A
 *
 * CLI script to run the full AI indexing pipeline.
 * Embeds all DocumentChunk records using Gemini text-embedding-004.
 *
 * Usage:
 *   node scripts/runIndexer.js              — incremental (skip already embedded)
 *   node scripts/runIndexer.js --force      — force re-embed all chunks
 *   node scripts/runIndexer.js --batch 5    — custom batch size
 *   node scripts/runIndexer.js --doc <id>   — index a single document
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const embeddingService = require('../src/services/embedding.service');
const logger = require('../src/config/logger');

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const force     = args.includes('--force');
const docIndex  = args.indexOf('--doc');
const docId     = docIndex !== -1 ? args[docIndex + 1] : null;
const batchIdx  = args.indexOf('--batch');
const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) : undefined;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   CampusAI — AI Indexing Pipeline (Phase 6B.2A) ');
  console.log('═══════════════════════════════════════════════════\n');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEY not set in .env');
    process.exit(1);
  }

  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY.slice(0, 10)}...`);
  console.log(`🔄 Force re-index: ${force}`);
  console.log(`📦 Batch size: ${batchSize || 10}`);
  if (docId) console.log(`📄 Single document: ${docId}`);
  console.log('');

  const startTime = Date.now();

  try {
    // ── Ensure HNSW index ──────────────────────────────────────────────────
    await embeddingService.ensureHnswIndex();

    let stats;

    if (docId) {
      // ── Single document mode ─────────────────────────────────────────────
      console.log(`\n📄 Indexing single document: ${docId}`);
      stats = await embeddingService.indexDocument(docId, { force });
      printDocStats(stats);
    } else {
      // ── Full index mode ──────────────────────────────────────────────────
      if (batchSize) embeddingService.batchSize = batchSize;
      stats = await embeddingService.indexAll({ force, batchSize });
      printGlobalStats(stats);
    }

    // ── Verification Report ──────────────────────────────────────────────
    console.log('\n\n══════════════ VERIFICATION REPORT ════════════════');
    const report = await embeddingService.getVerificationReport();
    printVerificationReport(report);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱  Total pipeline time: ${duration}s`);
    console.log('\n✅ AI Indexing pipeline complete.\n');

  } catch (err) {
    console.error('\n❌ Indexer failed:', err.message);
    logger.error('Indexer crashed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// ─── Print helpers ────────────────────────────────────────────────────────────

function printDocStats(stats) {
  console.log('\n── Document Index Result ──────────────────────────');
  console.log(`  Total chunks:    ${stats.total}`);
  console.log(`  ✅ Embedded:     ${stats.embedded}`);
  console.log(`  ⏩ Skipped:      ${stats.skipped}`);
  console.log(`  ❌ Failed:       ${stats.failed}`);
  console.log(`  ⏱  Duration:     ${stats.durationMs}ms`);
  if (stats.errors?.length > 0) {
    console.log(`\n  Errors:`);
    stats.errors.forEach((e) => console.log(`    - Chunk ${e.chunkId}: ${e.error}`));
  }
}

function printGlobalStats(stats) {
  console.log('\n\n═══════════════════════════ SUMMARY ═══════════════════════════');
  console.log(`  📚 Documents processed: ${stats.processedDocuments}/${stats.totalDocuments}`);
  console.log(`  📄 Total chunks:        ${stats.totalChunks}`);
  console.log(`  ✅ Embedded:            ${stats.embedded}`);
  console.log(`  ⏩ Skipped (done):      ${stats.skipped}`);
  console.log(`  ❌ Failed:              ${stats.failed}`);
  console.log(`  ⏱  Avg per embedding:   ${stats.avgEmbeddingMs}ms`);
  console.log(`  ⏱  Total duration:      ${(stats.totalDurationMs / 1000).toFixed(1)}s`);

  if (stats.errors.length > 0) {
    console.log(`\n  ⚠️  Errors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((e) => console.log(`    - Chunk ${e.chunkId}: ${e.error}`));
  }

  console.log('\n  Per-document results:');
  stats.perDocument.forEach((d) => {
    const icon = d.status === 'COMPLETED' ? '✅' : d.status === 'SKIPPED' ? '⏩' : d.status === 'PARTIAL' ? '⚠️ ' : '❌';
    const extra = d.chunksEmbedded !== undefined ? ` (${d.chunksEmbedded} embedded)` : '';
    console.log(`    ${icon} ${d.title}${extra}`);
  });
  console.log('═══════════════════════════════════════════════════════════════');
}

function printVerificationReport(report) {
  console.log(`\n  Chunks:`);
  console.log(`    Total:    ${report.chunks.total}`);
  console.log(`    Embedded: ${report.chunks.embedded}`);
  console.log(`    Pending:  ${report.chunks.pending}`);
  console.log(`    Coverage: ${report.chunks.total > 0 ? ((report.chunks.embedded / report.chunks.total) * 100).toFixed(1) : 0}%`);

  console.log(`\n  Document embeddingStatus:`);
  Object.entries(report.documents).forEach(([status, count]) => {
    console.log(`    ${status}: ${count}`);
  });

  console.log(`\n  Processing Jobs (GENERATE_EMBEDDINGS):`);
  Object.entries(report.jobs).forEach(([status, count]) => {
    console.log(`    ${status}: ${count}`);
  });

  console.log(`\n  HNSW Index:`);
  if (report.hnswIndex.exists) {
    console.log(`    ✅ EXISTS — ${report.hnswIndex.name}`);
    console.log(`    Definition: ${report.hnswIndex.def}`);
  } else {
    console.log(`    ❌ NOT FOUND`);
  }
}

main();
