import type { Job, JobSearchQuery } from './job.types.js';
import { JobSourceManager } from './sources/job-source.manager.js';
import { validateJob } from './job.validator.js';
import ms from 'ms';

export class JobCollectionService {
  constructor(private readonly sourceManager: JobSourceManager) {}

  async collectJobs(query: JobSearchQuery): Promise<Job[]> {
    const jobs = await this.sourceManager.fetchJobs(query);

    return jobs.filter(validateJob).filter((job) => this.isRecentJob(job));
  }

  private isRecentJob(job: Job): boolean {
    if (!job.publicationDate || isNaN(job.publicationDate.getTime())) {
      return true;
    }
    const cutoff = new Date(Date.now() - ms('7d'));

    return job.publicationDate >= cutoff;
  }
}
