import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { BaseAdapter, RawJob, NormalizedJob } from './base.adapter';
import { config } from '../config';

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
    const companies = config.jobs.targetCompanies || [];
    const targetSources = config.jobs.targetSources || [];
    const allJobs: RawJob[] = [];

    // Searching specified or ALL sites for this term
    const effectiveQueries = terms;

    const sourceFlags = targetSources.length > 0 ? targetSources.map((s: string) => `--site "${s}"`).join(' ') : '';
    if (targetSources.length > 0) {
      console.log(`[EverJobsAdapter] Targeting specific sources: ${targetSources.join(', ')}`);
    }

    for (const query of effectiveQueries) {
      // Searching specified or ALL sites for this term
      // We keep --linkedin-fetch-description to ensure LinkedIn roles are high-quality
      // We use -n 5 per site to keep the result set manageable across 160+ sources
      const command = `npx nest start cli -- search "${query}" -n 5 ${sourceFlags} --linkedin-fetch-description --format json`;
      
      try {
        console.log(`[EverJobsAdapter] Fetching from ${targetSources.length > 0 ? 'specified' : 'ALL'} resources for: ${query}`);
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
            console.log(`[EverJobsAdapter] Fetched ${jobs.length} raw jobs for "${query}" across all sites`);
            allJobs.push(...jobs);
          } catch (parseError) {
            console.error(`[EverJobsAdapter] JSON parse error for "${query}":`, parseError);
          }
        }
      } catch (error) {
        console.error(`[EverJobsAdapter] CLI execution failed for "${query}":`, error);
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
      
      const description = raw.description || '';
      const title = raw.title || 'Untitled Role';

      // 1. Work Mode Detection
      let workMode: 'remote' | 'hybrid' | 'onsite' = 'onsite';
      const isRemote = raw.isRemote === true || 
                      location.toLowerCase().includes('remote') || 
                      title.toLowerCase().includes('remote') ||
                      description.toLowerCase().includes('remote');
      
      const isHybrid = title.toLowerCase().includes('hybrid') || 
                      description.toLowerCase().includes('hybrid') ||
                      location.toLowerCase().includes('hybrid');

      if (isRemote) workMode = 'remote';
      else if (isHybrid) workMode = 'hybrid';

      return {
        title,
        company: raw.companyName || 'Unknown Company',
        location,
        description,
        url: raw.jobUrl,
        source: raw.site || 'everjobs',
        postedAt,
        workMode
      };
    } catch (err) {
      console.error('[EverJobsAdapter] Failed to parse job:', raw?.jobUrl, err);
      return null;
    }
  }
}
