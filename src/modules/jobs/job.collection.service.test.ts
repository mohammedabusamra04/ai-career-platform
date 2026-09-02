import { describe, expect, it, vi } from 'vitest';
import ms from 'ms';
import { JobCollectionService } from './job.collection.service.js';
import { JobSourceManager } from './sources/job-source.manager.js';
import { JobSourceType } from './job.types.js';
import { WorkType, ExperienceLevel } from '../../shared/types/job.js';
import type { JobSource } from './sources/job-source.interface.js';

describe('JobCollectionService', () => {
  it('should collect valid recent jobs', async () => {
    const source: JobSource = {
      type: JobSourceType.BAEED,
      fetchJobs: vi.fn().mockResolvedValue([
        {
          title: 'Backend Developer',
          company: 'Test Company',
          source: JobSourceType.BAEED,
          applicationUrl: 'https://example.com/job',
          workType: WorkType.REMOTE,
          experienceLevel: ExperienceLevel.JUNIOR,
          skills: ['Node.js'],
          publicationDate: new Date(),
          scrapedAt: new Date(),
        },
      ]),
    };

    const sourceManager = new JobSourceManager([source]);
    const service = new JobCollectionService(sourceManager);

    const jobs = await service.collectJobs({
      jobTitle: 'Backend Developer',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Backend Developer');
  });

  it('should exclude jobs older than 24 hours', async () => {
    const source: JobSource = {
      type: JobSourceType.BAEED,
      fetchJobs: vi.fn().mockResolvedValue([
        {
          title: 'Old Backend Developer',
          company: 'Old Company',
          source: JobSourceType.BAEED,
          applicationUrl: 'https://example.com/old-job',
          skills: ['Node.js'],
          publicationDate: new Date(Date.now() - ms('25h')),
          scrapedAt: new Date(),
        },
      ]),
    };

    const sourceManager = new JobSourceManager([source]);
    const service = new JobCollectionService(sourceManager);

    const jobs = await service.collectJobs({
      jobTitle: 'Backend Developer',
    });

    expect(jobs).toHaveLength(0);
  });

  it('should exclude incomplete jobs', async () => {
    const source: JobSource = {
      type: JobSourceType.BAEED,
      fetchJobs: vi.fn().mockResolvedValue([
        {
          title: '',
          company: 'Test Company',
          source: JobSourceType.BAEED,
          applicationUrl: 'https://example.com/job',
          skills: [],
          publicationDate: new Date(),
          scrapedAt: new Date(),
        },
      ]),
    };

    const sourceManager = new JobSourceManager([source]);
    const service = new JobCollectionService(sourceManager);

    const jobs = await service.collectJobs({
      jobTitle: 'Backend Developer',
    });

    expect(jobs).toHaveLength(0);
  });
});
