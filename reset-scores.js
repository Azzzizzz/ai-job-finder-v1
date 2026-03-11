const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function reset() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    console.log('--- RESETTING INCORRECT SCORES ---');
    
    // Reset similarityScore for jobs that were scored with empty embeddings
    const result = await jobs.updateMany(
      { similarityScore: { $exists: true } },
      { $unset: { similarityScore: "" } }
    );

    console.log(`✅ Reset similarityScore for ${result.modifiedCount} jobs.`);

  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await client.close();
  }
}

reset();
