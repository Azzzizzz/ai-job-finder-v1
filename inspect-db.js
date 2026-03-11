const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    console.log('--- FULL JOB TITLE LIST ---');
    
    const allJobs = await jobs.find({}, { projection: { title: 1, company: 1, source: 1, _id: 0 } })
      .sort({ source: 1, title: 1 })
      .toArray();
      
    allJobs.forEach((j, i) => {
      console.log(`${(i + 1).toString().padStart(3, ' ')}. [${j.source}] ${j.title} @ ${j.company}`);
    });

    console.log(`\nTOTAL UNIQUE JOBS: ${allJobs.length}`);

  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    await client.close();
  }
}

inspect();
