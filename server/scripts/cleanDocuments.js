require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
  await p.documentAuditLog.deleteMany();
  await p.documentProcessingJob.deleteMany();
  await p.documentChunk.deleteMany();
  await p.documentVersion.deleteMany();
  const r = await p.document.deleteMany();
  console.log('Cleaned', r.count, 'documents');
  await p.$disconnect();
}

clean().catch(e => { console.error(e); process.exit(1); });
