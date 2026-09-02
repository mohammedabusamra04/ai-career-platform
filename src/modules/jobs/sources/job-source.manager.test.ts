import { describe, expect, it, vi } from 'vitest';

import { JobSourceManager, JobSourceError } from './index.js';

import { JobSourceType, type Job, type JobSearchQuery } from '../job.types.js';

const query: JobSearchQuery = {
  jobTitle: 'Node.js Developer',
};

const createJob = (source: JobSourceType): Job => ({
  title: 'Node.js Developer',
  company: 'Test Company',
  source,
  applicationUrl: 'https://example.com/job',
  skills: ['Node.js'],
  publicationDate: new Date(),
  scrapedAt: new Date(),
});

describe('JobSourceManager', () => {
  it('should fetch jobs from all sources', async () => {
    const baytJob = createJob(JobSourceType.BAYT);
    const baeedJob = createJob(JobSourceType.BAEED);

    const manager = new JobSourceManager([
      {
        type: JobSourceType.BAYT,
        fetchJobs: vi.fn().mockResolvedValue([baytJob]),
      },
      {
        type: JobSourceType.BAEED,
        fetchJobs: vi.fn().mockResolvedValue([baeedJob]),
      },
    ]);

    const jobs = await manager.fetchJobs(query);

    expect(jobs).toEqual([baytJob, baeedJob]);
  });

  it('should continue fetching when one source fails', async () => {
    const baytJob = createJob(JobSourceType.BAYT);

    const manager = new JobSourceManager([
      {
        type: JobSourceType.BAYT,
        fetchJobs: vi.fn().mockResolvedValue([baytJob]),
      },
      {
        type: JobSourceType.BAEED,
        fetchJobs: vi.fn().mockRejectedValue(new JobSourceError('Failed', JobSourceType.BAEED)),
      },
    ]);

    const jobs = await manager.fetchJobs(query);

    expect(jobs).toEqual([baytJob]);
  });
});
