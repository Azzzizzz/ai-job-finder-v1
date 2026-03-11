const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function debug() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    
    // 1. Check Profile
    const profile = await db.collection('profiles').findOne();
    if (!profile || !profile.embedding) {
      console.error('❌ Profile or Profile Embedding MISSING!');
      return;
    }

    // 2. Check Jobs
    const allJobs = await db.collection('jobs').find({ embedding: { $exists: true, $not: { $size: 0 } } }).toArray();
    
    const results = allJobs.map(job => ({
      title: job.title,
      company: job.company,
      score: cosineSimilarity(profile.embedding, job.embedding)
    })).sort((a, b) => b.score - a.score);

    console.log(`--- SIMILARITY SCORES (Top ${results.length}) ---`);
    results.forEach((r, i) => {
      console.log(`${(i+1).toString().padStart(2, ' ')}. [${r.score.toFixed(4)}] ${r.title} @ ${r.company}`);
    });

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await client.close();
  }
}

debug();
