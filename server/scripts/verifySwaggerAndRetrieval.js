// Quick verification script for Swagger + Retrieval API
const http = require('http');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data.slice(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data.slice(0, 500) });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== 1. Testing GET /api/docs-json ===\n');
  const spec = await fetchJSON('http://localhost:5000/api/docs-json');
  console.log('Status:', spec.status);
  if (spec.status === 200 && spec.body.openapi) {
    console.log('OpenAPI Version:', spec.body.openapi);
    console.log('Tags:', spec.body.tags.map(t => t.name).join(', '));
    const retrievalPaths = Object.keys(spec.body.paths).filter(p => p.includes('retrieval'));
    console.log('Retrieval Paths:', retrievalPaths.join('\n  '));
    console.log('Schemas:', Object.keys(spec.body.components.schemas).join(', '));
  } else {
    console.log('Unexpected response:', JSON.stringify(spec.body).slice(0, 300));
  }

  console.log('\n=== 2. Testing POST /api/retrieval/search ===\n');
  const searchResult = await postJSON('http://localhost:5000/api/retrieval/search', {
    query: 'What is the attendance policy?',
    topK: 5,
  });
  console.log('Status:', searchResult.status);
  console.log(JSON.stringify(searchResult.body, null, 2));
}

main().catch(console.error);
