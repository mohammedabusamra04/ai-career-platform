import { Job, JobSearchQuery } from '../job.types.js';
import { JobSource } from './job-source.interface.js';
import { JobSourceError } from './job-source.error.js';
import logger from '../../../shared/utils/logger.js';

export class JobSourceManager {
  private lastFailedSources: string[] = [];

  constructor(private readonly sources: JobSource[]) {}

  getSources(): JobSource[] {
    return [...this.sources];
  }

  getLastFailedSources(): string[] {
    return [...this.lastFailedSources];
  }

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    this.lastFailedSources = [];
    const results = await Promise.allSettled(this.sources.map((source) => source.fetchJobs(query)));

    return results.flatMap((result, index) => {
      const source = this.sources[index];

      if (result.status === 'fulfilled') {
        return result.value;
      }

      this.lastFailedSources.push(source.type);

      const errorMessage =
        result.reason instanceof Error ? result.reason.message : String(result.reason);

      const error = new JobSourceError(
        `[Source: ${source.type}] Request failed: ${errorMessage}`,
        source.type,
        result.reason,
      );

      logger.error(error.message);

      return [];
    });
  }
}
