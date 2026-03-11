import Job from '../db/models/Job';
import Profile from '../db/models/Profile';
import { BaseAdapter, NormalizedJob } from '../sources/base.adapter';
import { RemoteOKAdapter } from '../sources/remoteok.adapter';
import { EverJobsAdapter } from '../sources/everjobs.adapter';
import { Deduplicator } from './deduplicator';
import { config } from '../config/index';

export class Aggregator {
  private async getAdapters(): Promise<BaseAdapter[]> {
    const profile = await Profile.findOne();
    const targetTitles = profile?.targetTitles?.length ? profile.targetTitles : ['Senior Backend Engineer'];
    
    return [
      new EverJobsAdapter(targetTitles),
      new RemoteOKAdapter(),
    ];
  }

  private isRelevant(title: string, targetTitles: string[]): boolean {
    const lowerTitle = title.toLowerCase();
    
    // 1. Must contain at least one technical keyword
    const techKeywords = ['engineer', 'developer', 'software', 'architect', 'data', 'backend', 'frontend', 'fullstack', 'full-stack', 'node', 'react', 'python', 'java', 'typescript', 'javascript', 'lead', 'staff', 'principal', 'product manager'];
    const hasTechKeyword = techKeywords.some(kw => lowerTitle.includes(kw));
    
    // 2. Must not contain non-tech exclusionary keywords
    const exclusionaryKeywords = ['accountant', 'sales', 'marketing', 'human resources', 'recruiter', 'nurse', 'technician', 'tutor', 'customer support', 'interpreter', 'actuary', 'brand strategist'];
    const isExcluded = exclusionaryKeywords.some(kw => lowerTitle.includes(kw));

    if (isExcluded) return false;
    
    // 3. Check for overlap with user's target titles
    const matchesTarget = targetTitles.some(target => {
      const parts = target.toLowerCase().split(' ');
      return parts.every(part => lowerTitle.includes(part)) || lowerTitle.includes(target.toLowerCase());
    });

    return hasTechKeyword || matchesTarget;
  }

  async run(): Promise<{ fetched: number; saved: number; errors: number }> {
    const adapters = await this.getAdapters();
    let totalFetched = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.jobs.freshnessDays);

    for (const adapter of adapters) {
      console.log(`[Aggregator] Running adapter: ${adapter.name}`);
      try {
        const jobs = await adapter.getJobs();
        totalFetched += jobs.length;

        const profile = await Profile.findOne();
        const targetTitles = profile?.targetTitles || [];

        for (const job of jobs) {
          // 0. Relevance Filter (Noise Guard)
          if (!this.isRelevant(job.title, targetTitles)) {
            // console.log(`[Aggregator] Skipping irrelevant job: ${job.title}`);
            continue;
          }

          // 1. Freshness filter
          if (job.postedAt < cutoffDate) continue;

          // 2. Normalize and check for existing
          const urlHash = Deduplicator.generateUrlHash(job.url);
          const contentHash = Deduplicator.generateHash(job);

          try {
            const result = await Job.findOneAndUpdate(
              { $or: [{ url: job.url }, { urlHash: urlHash }] },
              {
                ...job,
                urlHash,
                // Don't overwrite existing scoring data if re-feeding
                $setOnInsert: { processed: false, createdAt: new Date() }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            
            if (result) totalSaved++;
          } catch (err: any) {
            if (err.code !== 11000) { // Skip duplicate key errors if race condition
              console.error(`Error saving job ${job.url}:`, err.message);
              totalErrors++;
            }
          }
        }
      } catch (err) {
        console.error(`Error in adapter ${adapter.name}:`, err);
        totalErrors++;
      }
    }

    return { fetched: totalFetched, saved: totalSaved, errors: totalErrors };
  }
}
