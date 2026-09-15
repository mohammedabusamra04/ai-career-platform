import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemotiveJobSource } from '../../src/modules/jobs/sources/remotive.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';
import { ExperienceLevel, WorkType } from '../../src/shared/types/job.js';

describe('RemotiveJobSource', () => {
  let source: RemotiveJobSource;

  beforeEach(() => {
    source = new RemotiveJobSource();
    vi.restoreAllMocks();
  });

  it('should have type REMOTIVE', () => {
    expect(source.type).toBe(JobSourceType.REMOTIVE);
  });

  it('should fetch and map Remotive jobs successfully', async () => {
    const mockApiResponse = {
      jobs: [
        {
          id: 101,
          url: 'https://remotive.com/remote-jobs/software-dev/senior-backend-engineer-101',
          title: 'Senior Backend Engineer',
          company_name: 'GitHub',
          category: 'Software Development',
          tags: ['Node.js', 'PostgreSQL', 'TypeScript'],
          publication_date: '2026-03-01T10:00:00Z',
          candidate_required_location: 'Worldwide',
          description: '<p>Join our <strong>backend</strong> team!</p>',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const jobs = await source.fetchJobs({
      jobTitle: 'Backend Engineer',
      experienceLevel: ExperienceLevel.SENIOR,
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Backend Engineer',
      company: 'GitHub',
      source: JobSourceType.REMOTIVE,
      applicationUrl: 'https://remotive.com/remote-jobs/software-dev/senior-backend-engineer-101',
      url: 'https://remotive.com/remote-jobs/software-dev/senior-backend-engineer-101',
      location: 'Worldwide',
      remote: true,
      workType: WorkType.REMOTE,
      experienceLevel: ExperienceLevel.SENIOR,
      skills: ['Node.js', 'PostgreSQL', 'TypeScript'],
    });
    expect(jobs[0].description).toBe('Join our backend team!');
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
