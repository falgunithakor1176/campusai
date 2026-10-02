require('dotenv').config();

async function testDim() {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = ['models/gemini-embedding-001', 'models/gemini-embedding-2'];

  for (const model of models) {
    console.log(`\nTesting ${model} with outputDimensionality: 768...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:batchEmbedContents?key=${apiKey}`;
    const body = JSON.stringify({
      requests: [{
        model: model,
        content: { parts: [{ text: "Hello test" }] },
        outputDimensionality: 768
      }]
    });

    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();
      if (res.ok && data.embeddings) {
        console.log(`✅ Success for ${model}! Returned dimensions: ${data.embeddings[0].values.length}`);
      } else {
        console.log(`❌ Failed for ${model}:`, JSON.stringify(data.error || data));
      }
    } catch (err) {
      console.error(err.message);
    }
  }
}

testDim();
