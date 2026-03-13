import Job from '../db/models/Job';
import Profile from '../db/models/Profile';
import { config } from '../config/index';

export class RankingEngine {
  async run(): Promise<void> {
    const profile = await Profile.findOne();
    if (!profile) {
      console.warn('[RankingEngine] No profile found, skipping ranking.');
      return;
    }

    const targetTitles = profile.targetTitles.map((t: string) => t.toLowerCase());

    const jobs = await Job.find({
      similarityScore: { $exists: true },
      finalScore: { $exists: false }
    });

    const masterKeywords = new Set<string>();
    targetTitles.forEach((title: string) => {
      title.split(/[\s\-/]+/).forEach((kw: string) => {
        if (kw.length > 2) masterKeywords.add(kw);
      });
    });

    const blacklist = ['devops', 'security', 'cloud', 'infrastructure', 'systems', 'sre', 'qa', 'test', 'network', 'support'];
    const geoRestrictions = ['us based only', 'usa only', 'must reside in the us', 'uk only', 'eu based', 'cet timezone', 'work from us', 'us citizen'];
    const geoInclusions = ['worldwide', 'global', 'anywhere', 'remote india', 'hiring in india'];

    for (const job of jobs) {
      const similarity = job.similarityScore || 0;
      const jobTitleLow = job.title.toLowerCase();
      const searchableContext = (job.title + " " + job.description).toLowerCase();
      
      // 1. Domain-Aware Title Scoring (20%)
      let titleScore = 0;
      const isBlacklisted = blacklist.some(word => jobTitleLow.includes(word) && !targetTitles.some(t => t.includes(word)));
      
      if (!isBlacklisted) {
        const cleanTitle = jobTitleLow.replace(/\bsr\b\.?/g, 'senior').replace(/\bjr\b\.?/g, 'junior');
        const matchedKeywords = Array.from(masterKeywords).filter(kw => cleanTitle.includes(kw));
        const exactMatch = targetTitles.some(t => cleanTitle.includes(t));

        if (exactMatch) {
          titleScore = 1.0; // 20 pts
        } else if (matchedKeywords.length >= 2) {
          titleScore = 0.9;
        } else if (matchedKeywords.length === 1) {
          titleScore = 0.5;
        }
      }

      // 2. Geography & Eligibility Scoring (20%)
      let locationScore = 0.5; // Neutral
      const jobLoc = job.location.toLowerCase();
      
      // Tiered Location Check
      const isUS = jobLoc.includes('us') || jobLoc.includes('usa') || jobLoc.includes('united states');
      const isEurope = jobLoc.includes('europe') || jobLoc.includes('eu ') || jobLoc.includes('uk') || jobLoc.includes('germany') || jobLoc.includes('london');
      const isIndia = jobLoc.includes('india');
      const isRemote = job.workMode === 'remote';
      const isHybrid = job.workMode === 'hybrid';
      const isHyderabad = jobLoc.includes('hyderabad') || searchableContext.includes('hyderabad');

      if (isRemote) {
        if (isUS) locationScore = 1.0; // 20 pts (Premium US Remote)
        else if (isEurope) locationScore = 0.9; // 18 pts
        else if (isIndia) locationScore = 0.8; // 16 pts
        else locationScore = 0.7; // 14 pts (Generic Global Remote)
      } else if (isHybrid && isHyderabad) {
        locationScore = 1.0; // Hybrid in your city is a perfect match
      } else if (isHyderabad) {
        locationScore = 0.85; // Local but unknown mode
      } else if (isHybrid) {
        locationScore = 0.4; // Hybrid but NOT in your city (Penalty)
      }

      // Geography Guard (Residency Penalty)
      const hasRestriction = geoRestrictions.some(r => searchableContext.includes(r));
      const hasWorldwideBonus = geoInclusions.some(i => searchableContext.includes(i));
      
      if (hasRestriction && !hasWorldwideBonus) {
        locationScore = Math.max(0, locationScore - 1.0); // Penalty
      } else if (hasWorldwideBonus) {
        locationScore = 1.0; // Worldwide bonus locks at 20 pts
      }

      // 3. Experience Match (10%)
      const requiredExp = this.extractYearsOfExperience(job.description);
      let expScore = 0;
      if (requiredExp !== null) {
        if (requiredExp >= 3 && requiredExp <= 7) expScore = 1.0;
      } else {
        expScore = 0.5; // Neutral
      }

      // 4. Freshness (10%)
      const ageInHours = (Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60);
      const freshnessScore = (ageInHours <= 72) ? 1.0 : 0.5;

      // 5-Factor Weighted Score (Total 100%)
      job.finalScore = (similarity * 0.4) + (titleScore * 0.2) + (locationScore * 0.2) + (expScore * 0.1) + (freshnessScore * 0.1);
      
      // Mark as processed only if fully scored
      job.processed = true;
      await job.save();
    }
  }

  private extractYearsOfExperience(description: string): number | null {
    const expRegex = /(\d+)(?:\s*(?:-|\+)?\s*years?)/i;
    const match = description.match(expRegex);
    return match && match[1] ? parseInt(match[1], 10) : null;
  }

  async getTopJobs(): Promise<any[]> {
    return Job.find({ 
      similarityScore: { $gte: config.jobs.minSimilarityScore },
      finalScore: { $exists: true }
    })
    .sort({ finalScore: -1 })
    .limit(config.jobs.topJobsCount);
  }
}
