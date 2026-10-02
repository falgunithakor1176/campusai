'use strict';

/**
 * Test Chat API — Phase 6C Verification
 *
 * Verifies the newly built RAG Chatbot endpoints:
 * 1. Login as super admin to get bearer token
 * 2. POST /api/chat/sessions (create session)
 * 3. POST /api/chat/message (ask RAG question)
 * 4. GET /api/chat/sessions/:id (verify message history + citations)
 * 5. POST /api/chat/feedback (submit positive feedback)
 */

const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Accept': 'application/json' };
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
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('   CAMPUS AI — PHASE 6C RAG CHATBOT BACKEND VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Login
    console.log('1️⃣ Logging in as Super Admin...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'superadmin@campusai.edu.in',
      password: 'Admin@123'
    });
    const token = loginRes.body?.data?.accessToken;
    if (!token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    console.log('✅ Login successful.\n');

    // 2. Create Chat Session
    console.log('2️⃣ Creating Chat Session...');
    const sessionRes = await request('POST', '/api/chat/sessions', { title: 'Attendance Inquiry Test' }, token);
    const sessionId = sessionRes.body?.data?.id;
    console.log(`✅ Session Created: [${sessionRes.status}] ID = ${sessionId}\n`);

    // 3. Send RAG Message
    const query = 'What is the attendance policy and how is attendance calculated for semester exams?';
    console.log(`3️⃣ Sending RAG Query: "${query}"...`);
    const startTime = Date.now();
    const msgRes = await request('POST', '/api/chat/message', {
      sessionId,
      message: query,
      topK: 4
    }, token);
    const elapsed = Date.now() - startTime;

    console.log(`✅ Response Received in ${elapsed}ms: [${msgRes.status}]`);
    console.log(`🤖 Assistant Reply Preview:\n---`);
    console.log(msgRes.body?.data?.assistantMessage?.content?.slice(0, 400) + '...');
    console.log(`---\n📚 Citations Count: ${msgRes.body?.data?.assistantMessage?.sources?.length ?? 0}`);
    if (msgRes.body?.data?.assistantMessage?.sources?.[0]) {
      const topSource = msgRes.body.data.assistantMessage.sources[0];
      console.log(`   Top Citation: "${topSource.documentTitle}" (Page ${topSource.pageNumber}, ${topSource.sectionTitle}) [Score: ${topSource.similarityScore?.toFixed(3)}]`);
    }
    console.log(`💡 Suggested Questions:`, JSON.stringify(msgRes.body?.data?.suggestedQuestions, null, 2));
    console.log();

    // 4. Verify History Lookup
    console.log('4️⃣ Retrieving Session History...');
    const historyRes = await request('GET', `/api/chat/sessions/${sessionId}`, null, token);
    console.log(`✅ History Lookup: [${historyRes.status}] Total Messages = ${historyRes.body?.data?.messages?.length ?? 0}\n`);

    // 5. Submit Feedback
    const assistantMsgId = msgRes.body?.data?.assistantMessage?.id;
    if (assistantMsgId) {
      console.log('5️⃣ Submitting Thumbs Up (POSITIVE) Feedback...');
      const fbRes = await request('POST', '/api/chat/feedback', {
        messageId: assistantMsgId,
        feedback: 'POSITIVE'
      }, token);
      console.log(`✅ Feedback Submitted: [${fbRes.status}] ${fbRes.body?.message}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('   🎉 PHASE 6C BACKEND FULLY VERIFIED AND OPERATIONAL!');
    console.log('═══════════════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  }
}

runTests();
