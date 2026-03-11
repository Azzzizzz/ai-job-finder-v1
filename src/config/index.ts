import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-job-finder',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
    reasoningModel: process.env.REASONING_MODEL || 'gpt-4o',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    toEmail: process.env.RESEND_TO_EMAIL || '',
  },
  jobs: {
    minSimilarityScore: parseFloat(process.env.MIN_SIMILARITY_SCORE || '0.75'),
    topJobsCount: parseInt(process.env.TOP_JOBS_COUNT || '15', 10),
    freshnessDays: parseInt(process.env.FRESHNESS_DAYS || '7', 10),
  },
};

// Validate critical config
if (!config.openai.apiKey) {
  console.warn('WARNING: OPENAI_API_KEY is not set.');
}
if (!config.resend.apiKey) {
  console.warn('WARNING: RESEND_API_KEY is not set.');
}
