const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

function extractExp(description) {
  const expRegex = /(\d+)(?:\s*(?:-|\+)?\s*years?)/i;
  const match = description.match(expRegex);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

async function verify() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('ai-job-finder');
    
    // Get top 3 jobs to verify
    const jobs = await db.collection('jobs').find({ finalScore: { $exists: true } }).sort({ finalScore: -1 }).limit(3).toArray();
    
    console.log('--- SCORING AUDIT REPORT ---');
    
    jobs.forEach((job, i) => {
      console.log(`\n[Job #${i+1}] ${job.title}`);
      
      const sim = job.similarityScore || 0;
      const simPoints = (sim * 0.4 * 100).toFixed(1);
      
      const ageHours = (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60);
      const freshPoints = (ageHours <= 72 ? 1.0 : 0.5) * 10;
      
      const exp = extractExp(job.description);
      const expPoints = (exp >= 3 && exp <= 7 ? 1.0 : 0) * 10;
      
      const searchableContext = (job.title + " " + job.description).toLowerCase();
      const jobLoc = job.location.toLowerCase();
      const isRemote = jobLoc.includes('remote') || searchableContext.includes('remote');
      const isUS = jobLoc.includes('us') || jobLoc.includes('usa') || jobLoc.includes('united states');
      const isEU = jobLoc.includes('europe') || jobLoc.includes('uk') || jobLoc.includes('germany');
      const isIN = jobLoc.includes('india');
      const isHyd = jobLoc.includes('hyderabad');

      let locBase = 0.5;
      if (isRemote) {
        if (isUS) locBase = 1.0;
        else if (isEU) locBase = 0.9;
        else if (isIN) locBase = 0.8;
      } else if (isHyd) {
          locBase = 0.75;
      }

      const geoRestrictions = ['us based only', 'usa only', 'must reside in the us', 'uk only', 'eu based', 'cet timezone', 'work from us', 'us citizen'];
      const geoInclusions = ['worldwide', 'global', 'anywhere', 'remote india', 'hiring in india'];
      const hasRestriction = geoRestrictions.some(r => searchableContext.includes(r));
      const hasWorldwide = geoInclusions.some(i => searchableContext.includes(i));
      
      let locPoints = (hasWorldwide ? 1.0 : (hasRestriction ? Math.max(0, locBase - 1.0) : locBase)) * 20;

      const blacklist = ['devops', 'security', 'cloud', 'infrastructure', 'systems', 'sre', 'qa', 'test'];
      const isBlacklisted = blacklist.some(word => job.title.toLowerCase().includes(word));
      
      const currentTotal = Math.round(job.finalScore * 100);
      
      console.log(`| Component      | Score | Max | Detail`);
      console.log(`|----------------|-------|-----|----------------------------------`);
      console.log(`| 🧠 AI Match    | ${simPoints}  | 40  | Similarity: ${(sim*100).toFixed(1)}%`);
      console.log(`| 📍 Loc & Guard | ${locPoints.toFixed(1)}  | 20  | ${hasRestriction ? 'RESTRICTED' : (hasWorldwide ? 'WORLDWIDE' : 'Standard')}`);
      console.log(`| 🕒 Freshness   | ${freshPoints.toFixed(1)}  | 10  | Age: ${ageHours.toFixed(1)}h`);
      console.log(`| 🎓 Experience  | ${expPoints.toFixed(1)}  | 10  | Requirement: ${exp || 'N/A'}y`);
      console.log(`| 🚫 Blacklist   | ${isBlacklisted ? 'YES' : 'NO'}   | --  | Detected: ${isBlacklisted}`);
      console.log(`|----------------|-------|-----|----------------------------------`);
      console.log(`| ⭐ FINAL SCORE | ${currentTotal}    | 100 | Total Weighted Match`);
    });

  } finally {
    await client.close();
  }
}

verify();
