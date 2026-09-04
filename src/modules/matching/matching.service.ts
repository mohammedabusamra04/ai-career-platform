import type { Job } from '../jobs/job.types.js';
import type { UserPreferences } from '../preferences/preference.types.js';

import type { AIProvider } from './ai/ai-provider.interface.js';
import type { MatchingResult } from './matching.types.js';

export interface MatchedJob {
  job: Job;
  score: number;
  reason: string;
}

const AI_CONCURRENCY_LIMIT = 5;

export class MatchingService {
  constructor(private readonly aiProvider: AIProvider) {}

  async matchJob(job: Job, preferences: UserPreferences): Promise<MatchedJob> {
    const result: MatchingResult = await this.aiProvider.match({
      job,
      preferences,
    });

    return {
      job,
      score: result.score,
      reason: result.reason,
    };
  }

  async matchJobs(jobs: Job[], preferences: UserPreferences): Promise<MatchedJob[]> {
    const matchedJobs: MatchedJob[] = [];

    for (let i = 0; i < jobs.length; i += AI_CONCURRENCY_LIMIT) {
      const batch = jobs.slice(i, i + AI_CONCURRENCY_LIMIT);

      const results = await Promise.all(
        batch.map(async (job) => {
          try {
            return await this.matchJob(job, preferences);
          } catch {
            return null;
          }
        }),
      );

      matchedJobs.push(...results.filter((result): result is MatchedJob => result !== null));
    }

    return matchedJobs.sort((a, b) => b.score - a.score);
  }
}
