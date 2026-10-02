const http = require('http');

function testSearchWithOrigin(originUrl) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      query: 'What is the attendance policy?',
      topK: 5
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Origin': originUrl,
        'Accept': 'application/json'
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing POST /api/retrieval/search with Origin: http://localhost:5000 (Swagger UI) ===');
  const res5000 = await testSearchWithOrigin('http://localhost:5000');
  console.log('HTTP Status:', res5000.status);
  console.log('Access-Control-Allow-Origin Header:', res5000.headers['access-control-allow-origin']);
  console.log('Response JSON:', JSON.stringify(res5000.body, null, 2));

  console.log('\n=== Testing POST /api/retrieval/search with Origin: http://localhost:3000 (Frontend App) ===');
  const res3000 = await testSearchWithOrigin('http://localhost:3000');
  console.log('HTTP Status:', res3000.status);
  console.log('Access-Control-Allow-Origin Header:', res3000.headers['access-control-allow-origin']);
  console.log('Success:', res3000.body.success);
}

runTests().catch(console.error);
