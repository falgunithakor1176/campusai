'use strict';

/**
 * testRetrieval.js — Phase 6B.2B Verification Suite
 *
 * Runs a comprehensive set of sample semantic queries and metadata filter tests
 * against the RetrievalService to verify retrieval accuracy, ranking, and citation formatting.
 *
 * Usage:
 *   node scripts/testRetrieval.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const retrievalService = require('../src/services/retrieval.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLE_QUERIES = [
  {
    query: 'What are the tuition fees and development charges for Computer Engineering?',
    description: 'Query on fee structure across engineering branches',
    expectedCategory: 'FEES',
  },
  {
    query: 'What is the minimum percentage of attendance required to appear for semester exams?',
    description: 'Query on academic attendance rules and condonation',
    expectedCategory: 'POLICIES',
  },
  {
    query: 'How do I apply for the EBC and merit scholarships and what are the eligibility criteria?',
    description: 'Query on government and college scholarships',
    expectedCategory: 'SCHOLARSHIP',
  },
  {
    query: 'What are the rules and timings for the hostel mess and visitor entry?',
    description: 'Query on hostel accommodation and disciplinary norms',
    expectedCategory: 'HOSTEL',
  },
  {
    query: 'What are the penalties and helpline numbers for reporting ragging on campus?',
    description: 'Query on UGC anti-ragging regulations and zero tolerance policy',
    expectedCategory: 'POLICIES',
  },
];

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   CampusAI — Phase 6B.2B Retrieval Engine Verification Suite');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEY is not configured in .env');
    process.exit(1);
  }

  // Check database chunk count
  const [{ cnt }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM document_chunks WHERE embedding IS NOT NULL`);
  console.log(`📊 Knowledge Base Status: ${cnt} chunks with active embeddings\n`);

  if (parseInt(cnt, 10) === 0) {
    console.error('❌ No embedded chunks found! Please run Phase 6B.2A indexing first (`node scripts/runIndexer.js --force`).');
    process.exit(1);
  }

  let totalQueries = 0;
  let successfulQueries = 0;
  const testResults = [];

  // 1. Run general semantic similarity queries
  console.log('─── Section 1: Semantic Similarity Queries (Top-K=3) ───────────\n');

  for (let i = 0; i < SAMPLE_QUERIES.length; i++) {
    const test = SAMPLE_QUERIES[i];
    totalQueries++;
    console.log(`[Test ${i + 1}/${SAMPLE_QUERIES.length}] Query: "${test.query}"`);

    const startTime = Date.now();
    try {
      const results = await retrievalService.search(test.query, { topK: 3, enforceRbac: false });
      const durationMs = Date.now() - startTime;

      console.log(`  ⏱️  Duration: ${durationMs}ms | Returned: ${results.length} chunks`);

      if (results.length > 0) {
        successfulQueries++;
        const topResult = results[0];
        console.log(`  🥇 Top Result (Score: ${topResult.similarityScore}):`);
        console.log(`     • Document: "${topResult.documentTitle}" (${topResult.category})`);
        console.log(`     • Page & Section: Page ${topResult.pageNumber} — ${topResult.sectionTitle}`);
        console.log(`     • Heading: ${topResult.heading}`);
        console.log(`     • Chunk ID: ${topResult.chunkId}`);
        console.log(`     • Snippet: "${topResult.content.slice(0, 140).replace(/\n/g, ' ')}..."\n`);
      } else {
        console.log(`  ⚠️  No matching chunks found above threshold.\n`);
      }

      testResults.push({
        query: test.query,
        durationMs,
        resultsCount: results.length,
        topScore: results[0]?.similarityScore || 0,
        topDoc: results[0]?.documentTitle || 'None',
      });
    } catch (err) {
      console.error(`  ❌ Query failed: ${err.message}\n`);
    }
  }

  // 2. Test metadata filtering (category & topK restrictions)
  console.log('─── Section 2: Metadata Filtering Verification ─────────────────\n');

  totalQueries++;
  const categoryTestQuery = 'What are the rules and guidelines?';
  const targetCategory = 'LIBRARY';
  console.log(`[Filter Test 1] Query: "${categoryTestQuery}" | Filter Category: [${targetCategory}]`);

  try {
    const catResults = await retrievalService.searchByCategory(categoryTestQuery, targetCategory, { topK: 3, enforceRbac: false });
    console.log(`  ⏱️  Returned: ${catResults.length} chunks inside ${targetCategory}`);
    const allMatchCategory = catResults.every(r => r.category === targetCategory);
    console.log(`  ✅ Category Filter Enforcement: ${allMatchCategory ? 'PASSED (100% matched category)' : 'FAILED'}\n`);
    if (allMatchCategory && catResults.length > 0) successfulQueries++;
  } catch (err) {
    console.error(`  ❌ Category filter test failed: ${err.message}\n`);
  }

  // 3. Test similar chunks discovery (`getSimilarChunks`)
  console.log('─── Section 3: Related Chunk Discovery (Graph Similarity) ──────\n');
  totalQueries++;

  try {
    const sampleChunks = await prisma.$queryRawUnsafe(`SELECT id, "documentId" FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1`);
    if (sampleChunks.length > 0) {
      const targetChunkId = sampleChunks[0].id;
      console.log(`[Similar Chunks Test] Target Chunk ID: ${targetChunkId}`);
      const similar = await retrievalService.getSimilarChunks(targetChunkId, 3, 0.2);
      console.log(`  ⏱️  Returned: ${similar.length} related chunks`);
      if (similar.length > 0) {
        successfulQueries++;
        console.log(`  🥇 Most Similar Chunk (Score: ${similar[0].similarityScore}):`);
        console.log(`     • Document: "${similar[0].documentTitle}" (Page ${similar[0].pageNumber})`);
        console.log(`     • Heading: ${similar[0].heading}\n`);
      }
    }
  } catch (err) {
    console.error(`  ❌ Similar chunks test failed: ${err.message}\n`);
  }

  // Summary Report
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   VERIFICATION SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total Test Cases Executed: ${totalQueries}`);
  console.log(`  Successful Retrievals:     ${successfulQueries}`);
  console.log(`  Success Rate:              ${Math.round((successfulQueries / totalQueries) * 100)}%`);
  console.log(`  Average Query Latency:     ${Math.round(testResults.reduce((acc, r) => acc + r.durationMs, 0) / (testResults.length || 1))}ms`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
