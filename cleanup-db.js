const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    console.log('--- RELEVANCE CLEANUP ---');
    
    // Non-tech keywords to remove
    const exclusionaryKeywords = ['accountant', 'sales', 'marketing', 'human resources', 'recruiter', 'nurse', 'technician', 'tutor', 'customer support', 'interpreter', 'actuary', 'brand strategist'];
    
    let totalRemoved = 0;
    for (const kw of exclusionaryKeywords) {
      const result = await jobs.deleteMany({
        title: { $regex: kw, $options: 'i' }
      });
      if (result.deletedCount > 0) {
        console.log(`- Removed ${result.deletedCount} jobs containing "${kw}"`);
        totalRemoved += result.deletedCount;
      }
    }

    // Also remove generic titles with no tech keywords at all
    const techPattern = /engineer|developer|software|architect|data|backend|frontend|fullstack|full-stack|node|react|python|java|typescript|javascript|lead|staff|principal|product manager/i;
    const allJobs = await jobs.find({}).toArray();
    
    for (const job of allJobs) {
      if (!techPattern.test(job.title)) {
        await jobs.deleteOne({ _id: job._id });
        totalRemoved++;
      }
    }

    console.log(`\nCOMPLETED: Removed ${totalRemoved} irrelevant jobs.`);
    const remaining = await jobs.countDocuments();
    console.log(`Remaining jobs in database: ${remaining}`);

  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await client.close();
  }
}

cleanup();
