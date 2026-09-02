import { Job, JobSearchQuery } from './job.types.js';
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
    const cutoff = new Date(Date.now() - ms('24h'));

    return job.publicationDate >= cutoff;
  }
}
