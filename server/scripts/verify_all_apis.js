/**
 * End-to-End API Verification Script for CampusAI Demo Submission
 * Verifies route registrations, Swagger docs, database connection, CORS config, and Retrieval engine responses.
 */
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const prisma = require('../src/config/database');
const { swaggerSpec } = require('../src/config/swagger');

const PORT = 5001; // Use 5001 for automated test check

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CAMPUS AI END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let server;
  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ✓ ${testName}`);
    } else {
      console.error(`[FAIL] ✗ ${testName} ${details ? `- ${details}` : ''}`);
    }
  }

  try {
    // Test 1: Verify Swagger Spec Compilation & Endpoints
    assert(swaggerSpec && typeof swaggerSpec === 'object', 'Swagger Spec compiles successfully');
    const pathCount = Object.keys(swaggerSpec.paths || {}).length;
    assert(pathCount > 0, 'Swagger Spec contains documented endpoints', `Found ${pathCount} documented paths`);

    // Test 2: Verify Database Connection
    try {
      await prisma.$connect();
      assert(true, 'Prisma Database connection established');
    } catch (dbErr) {
      assert(false, 'Prisma Database connection established', dbErr.message);
    }

    // Start ephemeral server
    server = http.createServer(app);
    await new Promise((resolve, reject) => {
      server.listen(PORT, '127.0.0.1', resolve);
      server.on('error', reject);
    });
    console.log(`\n🚀 Test HTTP Server listening on http://127.0.0.1:${PORT}\n`);

    // Helper for HTTP requests
    const makeRequest = (method, endpoint, headers = {}, body = null) => {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: PORT,
          path: endpoint,
          method,
          headers: {
            ...headers,
            ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch (_) {}
            resolve({ status: res.statusCode, headers: res.headers, body: data, json });
          });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
      });
    };

    // Test 3: CORS Verification for Swagger UI (http://localhost:5000)
    const corsSwaggerRes = await makeRequest('OPTIONS', '/api/retrieval/search', {
      'Origin': 'http://localhost:5000',
      'Access-Control-Request-Method': 'POST'
    });
    assert(
      corsSwaggerRes.headers['access-control-allow-origin'] === 'http://localhost:5000',
      'CORS allows Origin http://localhost:5000 (Swagger UI)',
      `Returned: ${corsSwaggerRes.headers['access-control-allow-origin']}`
    );

    // Test 4: CORS Verification for Frontend (http://localhost:3000)
    const corsFrontendRes = await makeRequest('OPTIONS', '/api/retrieval/search', {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST'
    });
    assert(
      corsFrontendRes.headers['access-control-allow-origin'] === 'http://localhost:3000',
      'CORS allows Origin http://localhost:3000 (Frontend)',
      `Returned: ${corsFrontendRes.headers['access-control-allow-origin']}`
    );

    // Test 5: Health Check API (`GET /api/health`)
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.json && healthRes.json.success === true, 'GET /api/health returns 200 OK');

    // Test 6: Retrieval API (`POST /api/retrieval/search`) from Swagger UI origin
    const searchBody = JSON.stringify({ query: 'What is the attendance policy?', topK: 5 });
    const searchRes = await makeRequest('POST', '/api/retrieval/search', {
      'Origin': 'http://localhost:5000'
    }, searchBody);

    assert(searchRes.status === 200, 'POST /api/retrieval/search returns HTTP 200 OK', `Status: ${searchRes.status}`);
    assert(searchRes.json && searchRes.json.success === true, 'POST /api/retrieval/search returns success: true');
    assert(Array.isArray(searchRes.json?.data?.results), 'POST /api/retrieval/search returns array of chunks');

    if (searchRes.json?.data?.results) {
      console.log(`\nTop retrieved chunks for "What is the attendance policy?":`);
      searchRes.json.data.results.slice(0, 3).forEach((r, idx) => {
        const score = r.similarityScore ?? r.similarity ?? r.score;
        const title = r.metadata?.documentTitle || r.documentTitle || r.sectionTitle || 'N/A';
        console.log(`  [Rank ${idx + 1}] Score: ${typeof score === 'number' ? score.toFixed(4) : score} | Document: ${title}`);
      });
    }

    // Summary
    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passed}/${total} Tests Passed`);
    console.log('====================================================\n');

    if (passed !== total) {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Fatal Verification Error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runTests();
