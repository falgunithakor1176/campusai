require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const pgvec = await p.$queryRawUnsafe("SELECT extname, extversion FROM pg_extension WHERE extname='vector'");
  console.log('pgvector installed:', JSON.stringify(pgvec));

  const chunks = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM document_chunks");
  console.log('Total chunks:', chunks[0].cnt.toString());

  const embedded = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM document_chunks WHERE embedding IS NOT NULL");
  console.log('Embedded chunks:', embedded[0].cnt.toString());

  const docs = await p.$queryRawUnsafe('SELECT id, title, status, "embeddingStatus", "chunkCount" FROM documents LIMIT 5');
  console.log('Sample docs:', JSON.stringify(docs, null, 2));

  await p.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
