import { connectDB, disconnectDB } from '../db/connection';
import { Aggregator } from '../pipeline/aggregator';
import { EmbeddingService } from '../pipeline/embedding.service';
import { SemanticEngine } from '../matching/semantic.engine';
import { RankingEngine } from '../matching/ranking.engine';
import { Explainer } from '../ai/explainer';
import { EmailService } from '../notifications/email.service';

const dailyRun = async () => {
  try {
    await connectDB();
    console.log('\n🚀 Starting Daily Job Finder Pipeline...\n');

    // 1. Fetching
    console.log('--- PHASE 1: FETCHING JOBS ---');
    const aggregator = new Aggregator();
    const fetchResult = await aggregator.run();
    console.log('Fetch Results:', fetchResult);

    if (fetchResult.saved === 0) {
      console.log('No new jobs found. Skipping processing phases.');
    } else {
      // 2. Processing (Embeddings + Matching)
      console.log('\n--- PHASE 2: PROCESSING & SCORING ---');
      
      console.log('Generating embeddings...');
      const embeddingService = new EmbeddingService();
      const embResult = await embeddingService.processJobs();
      console.log('Embeddings result:', embResult);

      console.log('Running semantic matching...');
      const semanticEngine = new SemanticEngine();
      const matchResult = await semanticEngine.run();
      console.log('Matching result:', matchResult);

      console.log('Ranking jobs...');
      const rankingEngine = new RankingEngine();
      await rankingEngine.run();

      // 3. AI Explanations
      console.log('\n--- PHASE 3: AI REASONING ---');
      const topJobs = await rankingEngine.getTopJobs();
      if (topJobs.length > 0) {
        console.log(`Generating AI explanations for top ${topJobs.length} matches...`);
        const explainer = new Explainer();
        await explainer.processTopJobs(topJobs.map(j => j.id));
      } else {
        console.log('No high-scoring matches found for AI reasoning.');
      }
      
      // 4. Alerts
      console.log('\n--- PHASE 4: SENDING ALERTS ---');
      if (topJobs.length > 0) {
        console.log(`Sending daily digest to configured recipient...`);
        const emailService = new EmailService();
        await emailService.sendDailyDigest(topJobs);
        console.log('Email alert dispatched successfully.');
      } else {
        console.log('Skipping email alerts (no top matches).');
      }
    }

    console.log('\n✅ Pipeline iteration complete.\n');
  } catch (error) {
    console.error('\n❌ Pipeline failed during execution:');
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

dailyRun();
