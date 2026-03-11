import { connectDB, disconnectDB } from '../db/connection';
import { EmbeddingService } from '../pipeline/embedding.service';
import { SemanticEngine } from '../matching/semantic.engine';
import { RankingEngine } from '../matching/ranking.engine';
import { Explainer } from '../ai/explainer';

const run = async () => {
  await connectDB();
  console.log('--- PROCESSING JOBS ---');
  
  // 1. Generate Embeddings
  console.log('Generating embeddings...');
  const embeddingService = new EmbeddingService();
  const embResult = await embeddingService.processJobs();
  console.log('Embeddings result:', embResult);
  
  // 2. Semantic Matching
  console.log('Running semantic matching...');
  const semanticEngine = new SemanticEngine();
  const matchResult = await semanticEngine.run();
  console.log('Matching result:', matchResult);
  
  // 3. Ranking
  console.log('Ranking jobs...');
  const rankingEngine = new RankingEngine();
  await rankingEngine.run();
  
  // 4. Generate Explanations for top jobs
  console.log('Generating AI explanations...');
  const topJobs = await rankingEngine.getTopJobs();
  console.log(`Explaining top ${topJobs.length} jobs...`);
  const explainer = new Explainer();
  await explainer.processTopJobs(topJobs.map(j => j.id));
  
  console.log('Done.');
  await disconnectDB();
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
