import { JobSource } from './job.types.js';
import type { Job } from './job.types.js';

export function validateJob(job: Job): boolean {
  return (
    job.title.trim().length > 0 &&
    job.company.trim().length > 0 &&
    isValidUrl(job.applicationUrl) &&
    Object.values(JobSource).includes(job.source) &&
    job.publicationDate instanceof Date &&
    !Number.isNaN(job.publicationDate.getTime()) &&
    job.scrapedAt instanceof Date &&
    !Number.isNaN(job.scrapedAt.getTime())
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
