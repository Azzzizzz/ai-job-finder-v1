const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function show() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    console.log('--- TOP AI-RANKED JOBS (DEBUG) ---');
    
    const topJobs = await jobs.find({ 
      similarityScore: { $exists: true },
      explanation: { $exists: true }
    }).sort({ finalScore: -1 }).limit(1).toArray();

    if (topJobs.length > 0) {
        console.log(`Job: ${topJobs[0].title}`);
        console.log(`Explanation Object:`, JSON.stringify(topJobs[0].explanation, null, 2));
    } else {
      console.log('No jobs with explanations found yet.');
    }

  } catch (err) {
    console.error('Show results failed:', err);
  } finally {
    await client.close();
  }
}

show();
