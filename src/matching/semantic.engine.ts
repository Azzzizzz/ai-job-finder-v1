import Job from '../db/models/Job';
import Profile from '../db/models/Profile';
import { cosineSimilarity } from './cosine';
import { config } from '../config/index';

export class SemanticEngine {
  async run(): Promise<{ scored: number; matched: number }> {
    const profile = await Profile.findOne({});
    if (!profile || !profile.embedding) {
      console.warn('No candidate profile found. Skipping semantic matching.');
      return { scored: 0, matched: 0 };
    }

    // Get jobs that have embeddings but haven't been similarity-scored yet
    const jobs = await Job.find({
      embedding: { $exists: true, $not: { $size: 0 } },
      similarityScore: { $exists: false }
    });

    let scoredCount = 0;
    let matchedCount = 0;

    for (const job of jobs) {
      // Re-fetching with +embedding because it's excluded by default in schema
      const jobWithEmbedding = await Job.findById(job._id).select('+embedding');
      if (!jobWithEmbedding || !jobWithEmbedding.embedding) continue;

      const score = cosineSimilarity(profile.embedding, jobWithEmbedding.embedding);
      job.similarityScore = score;
      
      if (score >= config.jobs.minSimilarityScore) {
        matchedCount++;
      }
      
      await job.save();
      scoredCount++;
    }

    return { scored: scoredCount, matched: matchedCount };
  }
}
