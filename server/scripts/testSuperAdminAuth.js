const http = require('http');

function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
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
    req.write(data);
    req.end();
  });
}

function getJSON(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
    req.end();
  });
}

async function verifySuperAdminAuth() {
  console.log('=== 1. Testing Login for SUPER_ADMIN ===');
  const loginPayload = {
    email: 'superadmin@campusai.edu.in',
    password: 'Admin@123'
  };
  console.log('Sending login request to POST /api/auth/login with:', loginPayload);
  
  const loginRes = await postJSON('/api/auth/login', loginPayload);
  console.log('\nResponse Status:', loginRes.status);
  console.log('Response Body:', JSON.stringify(loginRes.body, null, 2));

  if (loginRes.status === 200 && loginRes.body.success) {
    const { accessToken, user } = loginRes.body.data;
    console.log('\n=== 2. Verifying Token & Role via GET /api/auth/me ===');
    const meRes = await getJSON('/api/auth/me', accessToken);
    console.log('GET /api/auth/me Status:', meRes.status);
    console.log('GET /api/auth/me Body:', JSON.stringify(meRes.body, null, 2));
  }
}

verifySuperAdminAuth().catch(console.error);
