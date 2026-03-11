import cron from 'node-cron';
import { Aggregator } from '../pipeline/aggregator';
import { EmbeddingService } from '../pipeline/embedding.service';
import { SemanticEngine } from '../matching/semantic.engine';
import { RankingEngine } from '../matching/ranking.engine';
import { Explainer } from '../ai/explainer';
import { EmailService } from '../notifications/email.service';

export const setupScheduler = () => {
  // 1. Every 6 hours: Fetch new jobs
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Running job fetch...');
    const aggregator = new Aggregator();
    await aggregator.run();
  });

  // 2. Daily at 08:00: Process, Rank, and Notify
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running daily alert pipeline...');
    
    // a. Aggregation (final check)
    await new Aggregator().run();
    
    // b. Embeddings
    const embeddingService = new EmbeddingService();
    await embeddingService.processJobs();
    
    // c. Semantic matching
    const semanticEngine = new SemanticEngine();
    await semanticEngine.run();
    
    // d. Ranking
    const rankingEngine = new RankingEngine();
    await rankingEngine.run();
    
    // e. Explanations for top jobs
    const topJobs = await rankingEngine.getTopJobs();
    const explainer = new Explainer();
    await explainer.processTopJobs(topJobs.map(j => j.id));
    
    // f. Notify
    // Re-fetch top jobs with explanations
    const finalJobs = await rankingEngine.getTopJobs();
    if (finalJobs.length > 0) {
      await new EmailService().sendDailyDigest(finalJobs);
    }
  });

  console.log('Scheduler initialized');
};
