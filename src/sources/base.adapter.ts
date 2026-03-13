export interface RawJob {
  [key: string]: any;
}

export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  postedAt: Date;
  workMode: 'remote' | 'hybrid' | 'onsite';
}

export abstract class BaseAdapter {
  abstract name: string;
  
  abstract fetchJobs(): Promise<RawJob[]>;
  
  abstract parseJob(raw: RawJob): NormalizedJob | null;

  async getJobs(): Promise<NormalizedJob[]> {
    try {
      const rawJobs = await this.fetchJobs();
      return rawJobs
        .map(raw => this.parseJob(raw))
        .filter((job): job is NormalizedJob => job !== null);
    } catch (error) {
      console.error(`Error in adapter ${this.name}:`, error);
      return [];
    }
  }
}
