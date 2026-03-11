const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkFreshness() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    const job = await jobs.findOne({ title: /Senior Python Backend Engineer/i });
    if (job) {
        const now = new Date();
        const postedAt = new Date(job.postedAt);
        const ageInMs = now.getTime() - postedAt.getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        const freshnessDays = 7;
        const freshnessScore = Math.max(0, 1 - (ageInDays / freshnessDays));
        const points = freshnessScore * 10; // contribution to 0-100 scale

        console.log(`Job: ${job.title}`);
        console.log(`Posted At: ${postedAt.toISOString()}`);
        console.log(`Current Time: ${now.toISOString()}`);
        console.log(`Age in Days: ${ageInDays.toFixed(2)}`);
        console.log(`Freshness Points (out of 10): ${points.toFixed(2)}`);
    } else {
        console.log('Job not found');
    }

  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.close();
  }
}

checkFreshness();
