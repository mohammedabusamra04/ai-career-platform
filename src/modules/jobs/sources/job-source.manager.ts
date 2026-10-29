import ms from 'ms';
import type { Job, JobSearchQuery } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { JobSourceError } from './job-source.error.js';
import logger from '../../../shared/utils/logger.js';

export const DEFAULT_SOURCE_TIMEOUT_MS = ms('10s');

export interface SourceTelemetry {
  source: string;
  status: 'fulfilled' | 'rejected' | 'timeout';
  jobCount: number;
  durationMs: number;
  error?: string;
}

export interface CollectionExecutionSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  jobs: Job[];
  telemetry: SourceTelemetry[];
  durationMs: number;
}

export class JobSourceManager {
  private lastFailedSources: string[] = [];
  private lastTelemetry: SourceTelemetry[] = [];

  constructor(
    private readonly sources: JobSource[],
    private readonly defaultTimeoutMs: number = DEFAULT_SOURCE_TIMEOUT_MS,
  ) {}

  getSources(): JobSource[] {
    return [...this.sources];
  }

  getLastFailedSources(): string[] {
    return [...this.lastFailedSources];
  }

  getLastTelemetry(): SourceTelemetry[] {
    return [...this.lastTelemetry];
  }

  async fetchJobs(
    query?: JobSearchQuery,
    timeoutMs: number = this.defaultTimeoutMs,
  ): Promise<Job[]> {
    this.lastFailedSources = [];
    this.lastTelemetry = [];

    const invocations = this.sources.map(async (source) => {
      const startTime = Date.now();
      let timer: NodeJS.Timeout | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new JobSourceError(
              `[Source: ${source.type}] Request timed out after ${timeoutMs}ms`,
              source.type,
            ),
          );
        }, timeoutMs);
      });

      try {
        const jobs = await Promise.race([source.fetchJobs(query), timeoutPromise]);
        const durationMs = Date.now() - startTime;

        this.lastTelemetry.push({
          source: source.type,
          status: 'fulfilled',
          jobCount: jobs.length,
          durationMs,
        });

        return jobs;
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const isTimeout =
          err instanceof JobSourceError && err.message.includes('timed out');
        const errorMessage = err instanceof Error ? err.message : String(err);

        this.lastTelemetry.push({
          source: source.type,
          status: isTimeout ? 'timeout' : 'rejected',
          jobCount: 0,
          durationMs,
          error: errorMessage,
        });

        throw err;
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    });

    const results = await Promise.allSettled(invocations);

    return results.flatMap((result, index) => {
      const source = this.sources[index];

      if (result.status === 'fulfilled') {
        return result.value;
      }

      this.lastFailedSources.push(source.type);

      const errorMessage =
        result.reason instanceof Error ? result.reason.message : String(result.reason);

      const error =
        result.reason instanceof JobSourceError
          ? result.reason
          : new JobSourceError(
              `[Source: ${source.type}] Request failed: ${errorMessage}`,
              source.type,
              result.reason,
            );

      logger.error(error.message);

      return [];
    });
  }

  async fetchJobsDetailed(
    query?: JobSearchQuery,
    timeoutMs: number = this.defaultTimeoutMs,
  ): Promise<CollectionExecutionSummary> {
    const startTime = Date.now();
    const jobs = await this.fetchJobs(query, timeoutMs);
    const durationMs = Date.now() - startTime;

    return {
      attempted: this.sources.length,
      succeeded: this.sources.length - this.lastFailedSources.length,
      failed: this.lastFailedSources.length,
      jobs,
      telemetry: this.getLastTelemetry(),
      durationMs,
    };
  }
}
