import OpenAI from 'openai';
import { config } from '../config/index';
import Profile from '../db/models/Profile';
import Job from '../db/models/Job';

export class Explainer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async explainJob(jobId: string): Promise<void> {
    const job = await Job.findById(jobId);
    const profile = await Profile.findOne({});
    
    if (!job || !profile) return;
    if (job.explanation?.summary) return; // Skip if already correctly explained

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.reasoningModel,
        messages: [
          {
            role: 'system',
            content: `You are a career assistant for a Senior Software Engineer. 
            Explain why a job matches their specific profile. 
            CRITICAL: Check if the job is Remote (Global/India allowed) or Hybrid in their target city. If the job is restricted to a region they cannot work in (e.g., US Only), mention this clearly.
            Return valid JSON only.`
          },
          {
            role: 'user',
            content: `
              Candidate Resume: ${profile.resumeText}
              Candidate Requirements: ${profile.requirementsText}
              
              Job Details:
              Title: ${job.title}
              Company: ${job.company}
              Location: ${job.location}
              Description: ${job.description.substring(0, 2000)}...

              Provide JSON:
              {
                "summary": "Short matching summary",
                "skillsOverlap": ["Skill1", "Skill2"],
                "relevanceExplanation": "Detailed explanation of fit, highlighting stack and location eligibility."
              }
            `
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (content) {
        job.explanation = JSON.parse(content);
        await job.save();
      }
    } catch (error) {
      console.error(`Error explaining job ${jobId}:`, error);
    }
  }

  async processTopJobs(topJobIds: string[]): Promise<void> {
    for (const id of topJobIds) {
      await this.explainJob(id);
    }
  }
}
