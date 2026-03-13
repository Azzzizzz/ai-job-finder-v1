import axios from 'axios';
import { BaseAdapter, RawJob, NormalizedJob } from './base.adapter';

export class RemoteOKAdapter extends BaseAdapter {
  name = 'RemoteOK';
  private apiUrl = 'https://remoteok.com/api';

  async fetchJobs(): Promise<RawJob[]> {
    try {
      const response = await axios.get(this.apiUrl);
      if (Array.isArray(response.data)) {
        const rawJobs = response.data.slice(1);
        
        // Initial noise filter: skip obviously non-tech roles
        const techKeywords = ['engineer', 'developer', 'software', 'architect', 'data', 'backend', 'frontend', 'fullstack', 'full-stack', 'node', 'react', 'python', 'java', 'typescript', 'javascript', 'lead', 'staff', 'principal', 'product manager'];
        
        return rawJobs.filter(job => {
          const title = (job.position || '').toLowerCase();
          return techKeywords.some(kw => title.includes(kw));
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching from RemoteOK:', error);
      return [];
    }
  }

  parseJob(raw: RawJob): NormalizedJob | null {
    if (!raw.position || !raw.company || !raw.url) return null;

    return {
      title: raw.position,
      company: raw.company,
      location: 'Remote',
      description: raw.description || '',
      url: raw.url,
      source: this.name,
      postedAt: new Date(raw.date),
      workMode: 'remote',
    };
  }
}
