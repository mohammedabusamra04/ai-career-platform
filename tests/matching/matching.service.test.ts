import { describe, it, expect, vi } from 'vitest';
import { MatchingService } from '../../src/modules/matching/matching.service.js';
import type { AIProvider } from '../../src/modules/matching/ai/ai-provider.interface.js';
import { ExperienceLevel, WorkType } from '../../src/shared/types/job.js';
import { JobSourceType, type Job } from '../../src/modules/jobs/job.types.js';

describe('MatchingService', () => {
  const dummyPreferences = {
    jobTitle: 'Backend Developer',
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    skills: ['Node.js', 'TypeScript'],
    timezone: 'Asia/Gaza',
    notificationTimes: ['09:00', '18:00'],
  };

  const dummyJob: Job = {
    title: 'Junior Backend Developer (Node.js)',
    company: 'Tech Corp',
    source: JobSourceType.ARBEITNOW,
    applicationUrl: 'https://example.com',
    url: 'https://example.com',
    remote: true,
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.JUNIOR,
    skills: ['Node.js', 'TypeScript'],
    publicationDate: new Date(),
    scrapedAt: new Date(),
  };

  it('should match jobs and return sorted matched results', async () => {
    const aiProvider: AIProvider = {
      match: vi.fn().mockResolvedValue({
        score: 95,
        reason: 'Perfect match for junior Node.js backend role',
      }),
    };

    const service = new MatchingService(aiProvider);
    const results = await service.matchJobs([dummyJob], dummyPreferences);

    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(95);
    expect(results[0].reason).toContain('Perfect match');
  });

  it('should filter out jobs when AI matching errors occurs', async () => {
    const aiProvider: AIProvider = {
      match: vi.fn().mockRejectedValue(new Error('AI rate limit')),
    };

    const service = new MatchingService(aiProvider);
    const results = await service.matchJobs([dummyJob], dummyPreferences);

    expect(results).toEqual([]);
  });
});
