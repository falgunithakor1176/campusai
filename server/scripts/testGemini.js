require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Listing available models...\n');

  // Try v1
  for (const version of ['v1', 'v1beta']) {
    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.log(`[${version}] Error:`, data.error?.message);
      continue;
    }

    const models = data.models || [];
    const embeddingModels = models.filter(m =>
      m.supportedGenerationMethods?.includes('embedContent') ||
      m.supportedGenerationMethods?.includes('batchEmbedContents') ||
      m.name?.toLowerCase().includes('embed')
    );

    console.log(`\n[${version}] Total models: ${models.length}`);
    console.log(`[${version}] Embedding-capable models:`);
    embeddingModels.forEach(m => {
      console.log(`  - ${m.name} | methods: ${m.supportedGenerationMethods?.join(', ')}`);
    });
  }
}

listModels().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
