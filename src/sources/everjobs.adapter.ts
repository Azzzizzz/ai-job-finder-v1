import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { BaseAdapter, RawJob, NormalizedJob } from './base.adapter';

const execAsync = promisify(exec);

export class EverJobsAdapter extends BaseAdapter {
  name = 'EverJobs (Expanded)';
  // private sites: string[] = ['linkedin'];

  constructor(private searchTerms: string | string[] = 'Senior Backend Engineer') {
    super();
  }

  async fetchJobs(): Promise<RawJob[]> {
    const cliPath = path.join(process.cwd(), 'external/ever-jobs');
    
    if (!fs.existsSync(cliPath)) {
      console.log(`[EverJobsAdapter] Skipping: External CLI not found at ${cliPath}`);
      return [];
    }

    const terms = Array.isArray(this.searchTerms) ? this.searchTerms : [this.searchTerms];
    const allJobs: RawJob[] = [];

    for (const term of terms) {
      // Searching ALL sites for this term
      // We keep --linkedin-fetch-description to ensure LinkedIn roles are high-quality
      // We use -n 5 per site to keep the result set manageable across 160+ sources
      const command = `npx nest start cli -- search "${term}" -n 5 --linkedin-fetch-description --format json`;
      
      try {
        console.log(`[EverJobsAdapter] Fetching from ALL resources for: ${term}`);
        const { stdout } = await execAsync(command, { 
          cwd: cliPath,
          maxBuffer: 50 * 1024 * 1024 // Increased buffer for all-source search
        });
        
        const arrayStart = stdout.search(/\[\s*\{|\[\s*\]/);
        const jsonEnd = stdout.lastIndexOf(']');
        
        if (arrayStart !== -1 && jsonEnd !== -1 && jsonEnd > arrayStart) {
          const jsonStr = stdout.substring(arrayStart, jsonEnd + 1);
          try {
            const jobs = JSON.parse(jsonStr);
            console.log(`[EverJobsAdapter] Fetched ${jobs.length} raw jobs for "${term}" across all sites`);
            allJobs.push(...jobs);
          } catch (parseError) {
            console.error(`[EverJobsAdapter] JSON parse error for "${term}":`, parseError);
          }
        }
      } catch (error) {
        console.error(`[EverJobsAdapter] CLI execution failed for "${term}":`, error);
      }
    }

    console.log(`[EverJobsAdapter] Successfully fetched ${allJobs.length} raw jobs in total across all resources`);
    return allJobs;
  }

  parseJob(raw: RawJob): NormalizedJob | null {
    try {
      if (!raw.jobUrl) return null;
      
      let location = 'Remote';
      if (raw.location) {
        if (typeof raw.location === 'object') {
          location = raw.location.city || raw.location.country || 'Remote';
        } else {
          location = raw.location;
        }
      }

      let postedAt = new Date();
      if (raw.datePosted) {
        const parsedDate = new Date(raw.datePosted);
        if (!isNaN(parsedDate.getTime())) {
          postedAt = parsedDate;
        }
      }
      
      return {
        title: raw.title || 'Untitled Role',
        company: raw.companyName || 'Unknown Company',
        location,
        description: raw.description || '',
        url: raw.jobUrl,
        source: `EverJobs (${raw.site || 'Aggregated'})`,
        postedAt,
      };
    } catch (err) {
      console.error('[EverJobsAdapter] Failed to parse job:', raw?.jobUrl, err);
      return null;
    }
  }
}
