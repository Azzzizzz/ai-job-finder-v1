import axios from 'axios';
import { BaseAdapter, RawJob, NormalizedJob } from './base.adapter';

export class YCJobsAdapter extends BaseAdapter {
  name = 'YC Jobs';
  private apiUrl = 'https://api.workatastartup.com/api/job_postings/search';

  async fetchJobs(): Promise<RawJob[]> {
    try {
      // YC Jobs often needs a POST request with specific filters for public API consistency
      // For this implementation, we'll use a simplified GET if available or mock the structure
      // Note: Real YC Jobs might require more complex interrogation or Algolia search keys
      const response = await axios.get('https://www.workatastartup.com/api/job_postings/_public');
      if (response.data && Array.isArray(response.data.job_postings)) {
        return response.data.job_postings;
      }
      return [];
    } catch (error) {
      console.error('Error fetching from YC Jobs:', error);
      return [];
    }
  }

  parseJob(raw: RawJob): NormalizedJob | null {
    if (!raw.job_title || !raw.company_name || !raw.id) return null;

    return {
      title: raw.job_title,
      company: raw.company_name,
      location: raw.location || 'Remote/Unknown',
      description: raw.job_description || '',
      url: `https://www.workatastartup.com/jobs/${raw.id}`,
      source: this.name,
      postedAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    };
  }
}
