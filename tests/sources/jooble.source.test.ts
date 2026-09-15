import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JoobleJobSource } from '../../src/modules/jobs/sources/jooble.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('JoobleJobSource', () => {
  let source: JoobleJobSource;

  beforeEach(() => {
    source = new JoobleJobSource('test_api_key');
    vi.restoreAllMocks();
  });

  it('should have type JOOBLE', () => {
    expect(source.type).toBe(JobSourceType.JOOBLE);
  });

  it('should return empty array if API key is missing', async () => {
    const unauthenticated = new JoobleJobSource('');
    const jobs = await unauthenticated.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });

  it('should POST search request and map Jooble jobs properly', async () => {
    const mockApiResponse = {
      totalCount: 1,
      jobs: [
        {
          id: 'j9876',
          title: 'Full Stack Node.js Developer',
          location: 'Remote, US',
          snippet: 'Working with <b>Node.js</b> and <b>TypeScript</b>',
          link: 'https://jooble.org/desc/j9876',
          company: 'Cloud Corp',
          updated: '2026-03-12T00:00:00Z',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'Node.js' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Full Stack Node.js Developer');
    expect(jobs[0].company).toBe('Cloud Corp');
    expect(jobs[0].source).toBe(JobSourceType.JOOBLE);
    expect(jobs[0].url).toBe('https://jooble.org/desc/j9876');
    expect(jobs[0].description).toBe('Working with Node.js and TypeScript');
    expect(jobs[0].remote).toBe(true);
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
