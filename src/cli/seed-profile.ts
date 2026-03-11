import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../db/connection';
import { EmbeddingService } from '../pipeline/embedding.service';

const run = async () => {
  await connectDB();
  console.log('--- SYNCING DIGITAL PERSONA ---');
  
  const resumePath = path.join(process.cwd(), 'data/resume.md');
  const reqsPath = path.join(process.cwd(), 'data/requirements.md');

  if (!fs.existsSync(resumePath) || !fs.existsSync(reqsPath)) {
    console.error('Error: Please ensure data/resume.md and data/requirements.md exist.');
    process.exit(1);
  }

  const resumeText = fs.readFileSync(resumePath, 'utf-8').trim();
  const requirementsText = fs.readFileSync(reqsPath, 'utf-8').trim();

  if (!resumeText || !requirementsText) {
    console.error('Error: Resume or Requirements file is empty.');
    process.exit(1);
  }

  const embeddingService = new EmbeddingService();

  console.log('Step 1: AI Analysis - Extracting search keywords and locations...');
  const { titles, locations } = await embeddingService.extractPersonaMetadata(resumeText, requirementsText);
  
  console.log(`Target Titles identified: ${titles.join(', ')}`);
  console.log(`Preferred Locations: ${locations.join(', ')}`);

  console.log('Step 2: Generating Vector Embedding for matching...');
  await embeddingService.updateProfileEmbedding(resumeText, requirementsText, titles, locations);
  
  console.log('--- SYNC COMPLETE ---');
  console.log('Your persona is now active. All future searches will use these keywords.');
  
  await disconnectDB();
  process.exit(0);
};

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
