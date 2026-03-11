const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspectResults() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    const jobs = db.collection('jobs');

    console.log('--- INSPECTING POTENTIAL MISMATCHES ---');
    
    // Find DevOps, Security, Cloud roles
    const problematicJobs = await jobs.find({
      $or: [
        { title: /DevOps/i },
        { title: /Security/i },
        { title: /Cloud/i }
      ],
      finalScore: { $exists: true }
    }).sort({ finalScore: -1 }).limit(10).toArray();

    problematicJobs.forEach(job => {
      console.log(`\nTitle: ${job.title}`);
      console.log(`Score: ${(job.finalScore * 100).toFixed(1)}`);
      console.log(`Location: ${job.location}`);
      console.log(`Similarity: ${(job.similarityScore * 100).toFixed(1)}`);
      // Re-run the title matching logic to see why it matched
      const targetTitles = ["Senior Backend Engineer", "Backend Engineer", "Senior Software Engineer", "Software Engineer", "Full Stack Engineer"];
      const masterKeywords = ["senior", "backend", "engineer", "software", "fullstack"];
      const cleanTitle = job.title.toLowerCase().replace(/\bsr\b\.?/g, 'senior').replace(/\bjr\b\.?/g, 'junior');
      const matchedKws = masterKeywords.filter(kw => cleanTitle.includes(kw));
      console.log(`Matched Keywords: ${matchedKws.join(', ')}`);
    });

  } finally {
    await client.close();
  }
}

inspectResults();
