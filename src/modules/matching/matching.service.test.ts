import { describe, expect, it, vi } from 'vitest';

import type { Job } from '../jobs/job.types.js';
import { JobSourceType } from '../jobs/job.types.js';
import type { UserPreferences } from '../preferences/preference.types.js';

import { WorkType, ExperienceLevel } from '../../shared/types/job.js';

import type { AIProvider } from './ai/ai-provider.interface.js';
import { MatchingService } from './matching.service.js';

const preferences: UserPreferences = {
  jobTitle: 'Backend Developer',
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.JUNIOR,
  location: 'Palestine',
  skills: ['Node.js', 'TypeScript'],
};

const createJob = (title: string): Job => ({
  title,
  company: 'Test Company',
  source: JobSourceType.OTHER,
  applicationUrl: 'https://example.com',
  location: 'Palestine',
  country: 'Palestine',
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.JUNIOR,
  description: 'Backend development using Node.js and TypeScript.',
  skills: ['Node.js', 'TypeScript'],
  publicationDate: new Date(),
  scrapedAt: new Date(),
});

describe('MatchingService', () => {
  it('should match a single job', async () => {
    const aiProvider: AIProvider = {
      match: vi.fn().mockResolvedValue({
        score: 90,
        reason: 'Strong match',
      }),
    };

    const service = new MatchingService(aiProvider);
    const job = createJob('Backend Developer');

    const result = await service.matchJob(job, preferences);

    expect(result).toEqual({
      job,
      score: 90,
      reason: 'Strong match',
    });

    expect(aiProvider.match).toHaveBeenCalledWith({
      job,
      preferences,
    });
  });

  it('should match multiple jobs', async () => {
    const aiProvider: AIProvider = {
      match: vi
        .fn()
        .mockResolvedValueOnce({
          score: 80,
          reason: 'Good match',
        })
        .mockResolvedValueOnce({
          score: 60,
          reason: 'Moderate match',
        }),
    };

    const service = new MatchingService(aiProvider);

    const jobs = [createJob('Backend Developer'), createJob('Frontend Developer')];

    const result = await service.matchJobs(jobs, preferences);

    expect(result).toHaveLength(2);
    expect(aiProvider.match).toHaveBeenCalledTimes(2);
  });

  it('should sort jobs by score in descending order', async () => {
    const aiProvider: AIProvider = {
      match: vi
        .fn()
        .mockResolvedValueOnce({
          score: 60,
          reason: 'Moderate match',
        })
        .mockResolvedValueOnce({
          score: 95,
          reason: 'Excellent match',
        })
        .mockResolvedValueOnce({
          score: 75,
          reason: 'Good match',
        }),
    };

    const service = new MatchingService(aiProvider);

    const jobs = [createJob('Job 1'), createJob('Job 2'), createJob('Job 3')];

    const result = await service.matchJobs(jobs, preferences);

    expect(result.map((job) => job.score)).toEqual([95, 75, 60]);
  });

  it('should keep jobs with low scores', async () => {
    const aiProvider: AIProvider = {
      match: vi.fn().mockResolvedValue({
        score: 20,
        reason: 'Weak match',
      }),
    };

    const service = new MatchingService(aiProvider);
    const job = createJob('Unrelated Job');

    const result = await service.matchJobs([job], preferences);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(20);
  });
  it('should limit concurrent AI requests', async () => {
    let activeRequests = 0;
    let maxConcurrentRequests = 0;

    const aiProvider: AIProvider = {
      match: vi.fn(async () => {
        activeRequests++;

        maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequests);

        await new Promise((resolve) => setTimeout(resolve, 10));

        activeRequests--;

        return {
          score: 80,
          reason: 'Good match',
        };
      }),
    };

    const service = new MatchingService(aiProvider);

    const jobs = Array.from({ length: 12 }, (_, index) => createJob(`Job ${index + 1}`));

    const result = await service.matchJobs(jobs, preferences);

    expect(result).toHaveLength(12);
    expect(maxConcurrentRequests).toBeLessThanOrEqual(5);
    expect(aiProvider.match).toHaveBeenCalledTimes(12);
  });
  it('should continue matching when an AI request fails', async () => {
    const aiProvider: AIProvider = {
      match: vi
        .fn()
        .mockResolvedValueOnce({
          score: 90,
          reason: 'Excellent match',
        })
        .mockRejectedValueOnce(new Error('AI request failed'))
        .mockResolvedValueOnce({
          score: 80,
          reason: 'Good match',
        }),
    };

    const service = new MatchingService(aiProvider);

    const jobs = [createJob('Job 1'), createJob('Job 2'), createJob('Job 3')];

    const result = await service.matchJobs(jobs, preferences);

    expect(result).toHaveLength(2);
    expect(result.map((job) => job.score)).toEqual([90, 80]);
    expect(aiProvider.match).toHaveBeenCalledTimes(3);
  });
});
