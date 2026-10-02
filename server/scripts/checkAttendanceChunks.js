const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  console.log('=== 1. Checking Attendance Policy Document & Chunks ===');
  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { title: { contains: 'Attendance', mode: 'insensitive' } },
        { title: { contains: 'Handbook', mode: 'insensitive' } }
      ]
    },
    include: {
      chunks: {
        select: {
          id: true,
          sectionTitle: true,
          heading: true,
          tokenCount: true,
          content: true,
        }
      }
    }
  });

  docs.forEach(d => {
    console.log(`\nDoc: "${d.title}" [Category: ${d.category}] | Status: ${d.embeddingStatus} | Total Chunks: ${d.chunks.length}`);
    d.chunks.forEach((c, i) => {
      console.log(`  Chunk ${i + 1} (${c.tokenCount} tokens): Section="${c.sectionTitle}" | Heading="${c.heading}"`);
      console.log(`    Snippet: ${c.content.slice(0, 200).replace(/\n/g, ' ')}...`);
    });
  });

  console.log('\n=== 2. Checking Chunks that specifically contain the word "attendance" across ALL docs ===');
  const chunksWithAttendance = await prisma.documentChunk.findMany({
    where: {
      content: { contains: 'attendance', mode: 'insensitive' }
    },
    select: {
      id: true,
      documentTitle: true,
      sectionTitle: true,
      heading: true,
      tokenCount: true,
      content: true,
    },
    take: 10
  });

  chunksWithAttendance.forEach(c => {
    console.log(`\nDoc: "${c.documentTitle}" | Section="${c.sectionTitle}" (${c.tokenCount} tokens)`);
    console.log(`  Content: ${c.content.slice(0, 250).replace(/\n/g, ' ')}...`);
  });

  await prisma.$disconnect();
}

investigate().catch(console.error);
