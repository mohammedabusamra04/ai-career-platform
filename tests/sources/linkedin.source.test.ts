import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkedinJobSource } from '../../src/modules/jobs/sources/linkedin.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('LinkedinJobSource', () => {
  let source: LinkedinJobSource;

  beforeEach(() => {
    source = new LinkedinJobSource('rapidapi_key');
    vi.restoreAllMocks();
  });

  it('should have type LINKEDIN', () => {
    expect(source.type).toBe(JobSourceType.LINKEDIN);
  });

  it('should return empty array if RapidAPI key is not configured', async () => {
    const unauthenticated = new LinkedinJobSource('');
    const jobs = await unauthenticated.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });

  it('should parse RapidAPI JSearch response correctly', async () => {
    const mockApiResponse = {
      status: 'OK',
      data: [
        {
          job_id: 'abc123',
          job_title: 'Software Engineer - Backend',
          employer_name: 'Microsoft',
          job_apply_link: 'https://careers.microsoft.com/job/abc123',
          job_city: 'Redmond',
          job_country: 'US',
          job_is_remote: false,
          job_description: 'Backend distributed systems',
          job_posted_at_datetime_utc: '2026-03-01T12:00:00.000Z',
          job_required_skills: ['TypeScript', 'Azure'],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Software Engineer' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Software Engineer - Backend',
      company: 'Microsoft',
      source: JobSourceType.LINKEDIN,
      applicationUrl: 'https://careers.microsoft.com/job/abc123',
      url: 'https://careers.microsoft.com/job/abc123',
      location: 'Redmond',
      country: 'US',
      skills: ['TypeScript', 'Azure'],
    });
  });
});
