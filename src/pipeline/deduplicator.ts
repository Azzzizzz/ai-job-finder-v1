import crypto from 'crypto';
import { NormalizedJob } from '../sources/base.adapter';

export class Deduplicator {
  static generateHash(job: NormalizedJob): string {
    // Primary dedup: URL
    // Secondary dedup: Title + Company + Location
    const data = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateUrlHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }
}
