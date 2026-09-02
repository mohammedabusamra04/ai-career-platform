import { Job, JobSearchQuery } from '../job.types.js';
import { JobSource } from './job-source.interface.js';
import { JobSourceError } from './job-source.error.js';
import logger from '../../../shared/utils/logger.js';

export class JobSourceManager {
  constructor(private readonly sources: JobSource[]) {}

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    const results = await Promise.allSettled(this.sources.map((source) => source.fetchJobs(query)));

    return results.flatMap((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      const source = this.sources[index];

      const error = new JobSourceError(
        `Failed to fetch jobs from ${source.type}`,
        source.type,
        result.reason,
      );

      logger.error(error.message);

      return [];
    });
  }
}
