import OpenAI from 'openai';
import { config } from '../config/index';
import Job from '../db/models/Job';
import Profile from '../db/models/Profile';

export class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: text.replace(/\n/g, ' '),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async processJobs(): Promise<{ processed: number; errors: number }> {
    const jobsToProcess = await Job.find({ 
      processed: false, 
      description: { $exists: true, $ne: '' },
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    }).limit(100);

    let processedCount = 0;
    let errorCount = 0;

    for (const job of jobsToProcess) {
      try {
        const text = `${job.title} at ${job.company} in ${job.location}. ${job.description}`;
        const embedding = await this.generateEmbedding(text);
        
        job.embedding = embedding;
        await job.save();
        processedCount++;
      } catch (err) {
        console.error(`Error processing embedding for job ${job.id}:`, err);
        errorCount++;
      }
    }

    return { processed: processedCount, errors: errorCount };
  }

  async updateProfileEmbedding(
    resumeText: string, 
    requirementsText: string,
    targetTitles: string[],
    targetLocations: string[]
  ): Promise<void> {
    const combinedText = `RESUME:\n${resumeText}\n\nREQUIREMENTS:\n${requirementsText}`;
    const embedding = await this.generateEmbedding(combinedText);
    
    await Profile.findOneAndUpdate(
      {},
      { 
        resumeText, 
        requirementsText, 
        targetTitles, 
        targetLocations, 
        embedding, 
        updatedAt: new Date() 
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async extractPersonaMetadata(resumeText: string, requirementsText: string): Promise<{ titles: string[], locations: string[] }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.reasoningModel,
        messages: [
          {
            role: 'system',
            content: `You are a career expert. Based on a user's resume and job requirements, extract exactly 5 targeted job titles for automated search queries and a list of preferred locations. 
            Return the result as a raw JSON object with keys: "titles" (array of strings) and "locations" (array of strings).`
          },
          {
            role: 'user',
            content: `RESUME:\n${resumeText}\n\nREQUIREMENTS:\n${requirementsText}`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content || '{}';
      const data = JSON.parse(content);
      return {
        titles: data.titles || [],
        locations: data.locations || []
      };
    } catch (error) {
      console.error('Error extracting persona metadata:', error);
      return { titles: [], locations: [] };
    }
  }
}
