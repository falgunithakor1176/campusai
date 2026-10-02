const prisma = require('../config/database');

async function main() {
  console.log("Connecting via Prisma...");
  try {
    const res = await prisma.$queryRaw`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
    console.log("Extensions:", res);
  } catch (err) {
    console.error("Error query:", err.message);
  }
  
  try {
    console.log("Attempting to run CREATE EXTENSION IF NOT EXISTS vector;");
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("✅ Success! vector extension is active.");
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
