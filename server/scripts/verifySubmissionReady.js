const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Accept': 'application/json',
    };
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers,
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function verifyAll() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('   CAMPUS AI - FINAL SUBMISSION END-TO-END VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assertResult(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Healthcheck
    const health = await request('GET', '/api/health');
    assertResult('Health Check API (/api/health)', health.status === 200 && health.body.success, `Status: ${health.status}`);

    // 2. Swagger Specification
    const swagger = await request('GET', '/api/docs-json');
    const hasOpenAPI = swagger.status === 200 && swagger.body && swagger.body.openapi;
    const pathsCount = hasOpenAPI ? Object.keys(swagger.body.paths || {}).length : 0;
    const tagsCount = hasOpenAPI ? (swagger.body.tags || []).length : 0;
    assertResult('OpenAPI / Swagger Spec JSON (/api/docs-json)', hasOpenAPI && pathsCount >= 4, `OpenAPI ${swagger.body.openapi || 'N/A'}, ${tagsCount} Tags, ${pathsCount} Paths defined directly`);

    // 3. Auth - Super Admin Login
    const superAdminLogin = await request('POST', '/api/auth/login', {
      email: 'superadmin@campusai.edu.in',
      password: 'Admin@123'
    });
    const superAdminToken = superAdminLogin.body?.data?.accessToken;
    assertResult('Super Admin Login (/api/auth/login)', superAdminLogin.status === 200 && superAdminToken && superAdminLogin.body.data.user.role === 'SUPER_ADMIN', `Role: ${superAdminLogin.body?.data?.user?.role}`);

    // 4. Auth - Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin1@campusai.edu.in',
      password: 'Admin@123'
    });
    const adminToken = adminLogin.body?.data?.accessToken;
    assertResult('Admin Login (/api/auth/login)', adminLogin.status === 200 && adminToken && adminLogin.body.data.user.role === 'ADMIN', `Role: ${adminLogin.body?.data?.user?.role}`);

    // 5. Auth - Current User (/api/auth/me) with Super Admin token
    if (superAdminToken) {
      const me = await request('GET', '/api/auth/me', null, superAdminToken);
      assertResult('Protected Route Auth Check (/api/auth/me)', me.status === 200 && me.body.success && me.body.data.user.email === 'superadmin@campusai.edu.in');
    } else {
      assertResult('Protected Route Auth Check (/api/auth/me)', false, 'Skipped (No token)');
    }

    // 6. Document Management API - List Documents
    if (superAdminToken) {
      const docsList = await request('GET', '/api/documents?limit=5', null, superAdminToken);
      const docsArr = Array.isArray(docsList.body?.data) ? docsList.body.data : (docsList.body?.data?.documents || []);
      assertResult('Document Management List (/api/documents)', docsList.status === 200 && docsList.body.success && docsArr.length > 0, `Retrieved ${docsArr.length} documents`);
    }

    // 7. Document Management API - Statistics
    if (superAdminToken) {
      const docsStats = await request('GET', '/api/documents/stats', null, superAdminToken);
      assertResult('Document Statistics (/api/documents/stats)', docsStats.status === 200 && docsStats.body.success, `Total Documents: ${docsStats.body?.data?.totalDocuments ?? 'N/A'}`);
    }

    // 8. Retrieval Engine - Semantic Search
    const searchRes = await request('POST', '/api/retrieval/search', {
      query: 'What are the rules for attendance and examinations?',
      topK: 3
    });
    assertResult('Retrieval Engine Vector Search (/api/retrieval/search)', searchRes.status === 200 && searchRes.body.success && Array.isArray(searchRes.body.data?.results), `Found ${searchRes.body?.data?.results?.length ?? 0} results in ${searchRes.body?.data?.durationMs ?? 'N/A'}ms`);

    // 9. RAG Chatbot - Create Session (/api/chat/sessions)
    if (superAdminToken) {
      const sessionRes = await request('POST', '/api/chat/sessions', { title: 'Demo Verification Chat' }, superAdminToken);
      const sessionId = sessionRes.body?.data?.id;
      assertResult('RAG Chatbot Create Session (/api/chat/sessions)', sessionRes.status === 201 && sessionRes.body.success && sessionId, `Session ID: ${sessionId}`);

      // 10. RAG Chatbot - Send Query & Receive Citations (/api/chat/message)
      if (sessionId) {
        const msgRes = await request('POST', '/api/chat/message', {
          sessionId,
          message: 'What is the minimum attendance requirement and grading system?',
          topK: 4
        }, superAdminToken);
        const assistantMsg = msgRes.body?.data?.assistantMessage;
        const sourcesCount = assistantMsg?.sources?.length ?? 0;
        assertResult('RAG Chatbot Message Synthesis (/api/chat/message)', msgRes.status === 200 && msgRes.body.success && assistantMsg?.content && sourcesCount > 0, `Generated reply in ${assistantMsg?.responseTimeMs || 'N/A'}ms with ${sourcesCount} citations`);

        // 11. RAG Chatbot - Retrieve Session History (/api/chat/sessions/:id)
        const historyRes = await request('GET', `/api/chat/sessions/${sessionId}`, null, superAdminToken);
        assertResult('RAG Chatbot History Retrieval (/api/chat/sessions/:id)', historyRes.status === 200 && historyRes.body?.data?.messages?.length >= 2, `Messages Count: ${historyRes.body?.data?.messages?.length ?? 0}`);
      }
    }

  } catch (err) {
    console.error('Unhandled verification error:', err);
    failed++;
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`   SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyAll().catch(console.error);
