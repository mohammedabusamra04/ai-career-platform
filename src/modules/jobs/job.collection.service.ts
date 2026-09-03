import type { Job, JobSearchQuery } from './job.types.js';
import { JobSourceManager } from './sources/job-source.manager.js';
import { validateJob } from './job.validator.js';
import ms from 'ms';

interface JobDeduplicator {
  deduplicate(jobs: Job[]): Promise<{
    uniqueJobs: Job[];
    duplicateJobs: Job[];
  }>;
}

export class JobCollectionService {
  constructor(
    private readonly sourceManager: JobSourceManager,
    private readonly deduplicationService: JobDeduplicator,
  ) {}

  async collectJobs(query: JobSearchQuery): Promise<Job[]> {
    const jobs = await this.sourceManager.fetchJobs(query);

    const validRecentJobs = jobs.filter(validateJob).filter((job) => this.isRecentJob(job));

    const result = await this.deduplicationService.deduplicate(validRecentJobs);

    return result.uniqueJobs;
  }

  private isRecentJob(job: Job): boolean {
    const cutoff = new Date(Date.now() - ms('24h'));

    return job.publicationDate >= cutoff;
  }
}
