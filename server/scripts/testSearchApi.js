const http = require('http');

const body = JSON.stringify({ query: 'What is the attendance policy?', topK: 5 });

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/retrieval/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => {
    const r = JSON.parse(d);
    console.log('=== POST /api/retrieval/search ===');
    console.log('HTTP Status:', res.statusCode);
    console.log('Success:', r.success);
    console.log('Message:', r.message);
    console.log('Query:', r.data.query);
    console.log('Total Results:', r.data.totalResults);
    console.log('Duration:', r.data.durationMs + 'ms');
    console.log('');
    r.data.results.forEach((c, i) => {
      console.log('--- Result ' + (i + 1) + ' (Score: ' + c.similarityScore + ') ---');
      console.log('  Document:', c.documentTitle);
      console.log('  Category:', c.category);
      console.log('  Page:', c.pageNumber);
      console.log('  Section:', c.sectionTitle);
      console.log('  Heading:', c.heading);
      console.log('  Chunk ID:', c.chunkId);
      console.log('  Snippet:', c.content.slice(0, 120).replace(/\n/g, ' ') + '...');
      console.log();
    });
  });
});
req.write(body);
req.end();
