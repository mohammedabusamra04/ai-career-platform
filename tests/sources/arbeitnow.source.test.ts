import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArbeitnowJobSource } from '../../src/modules/jobs/sources/arbeitnow.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('ArbeitnowJobSource', () => {
  let source: ArbeitnowJobSource;

  beforeEach(() => {
    source = new ArbeitnowJobSource();
    vi.restoreAllMocks();
  });

  it('should have type ARBEITNOW', () => {
    expect(source.type).toBe(JobSourceType.ARBEITNOW);
  });

  it('should fetch and map remote tech jobs successfully', async () => {
    const mockApiResponse = {
      data: [
        {
          slug: 'senior-nodejs-engineer',
          company_name: 'Tech Corp',
          title: 'Senior Node.js Engineer',
          description: '<p>Looking for a <strong>Node.js</strong> backend developer.</p>',
          remote: true,
          url: 'https://www.arbeitnow.com/view/senior-nodejs-engineer',
          tags: ['Node.js', 'TypeScript', 'Backend'],
          job_types: ['Full Time'],
          location: 'Berlin, Germany',
          created_at: 1710000000,
        },
        {
          slug: 'unrelated-chef-job',
          company_name: 'Food Inc',
          title: 'Head Chef',
          description: 'Cooking fine cuisine',
          remote: false,
          url: 'https://www.arbeitnow.com/view/chef',
          tags: ['Culinary'],
          location: 'Munich, Germany',
          created_at: 1710000000,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const jobs = await source.fetchJobs({
      jobTitle: 'Node.js',
      skills: ['TypeScript'],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Senior Node.js Engineer');
    expect(jobs[0].company).toBe('Tech Corp');
    expect(jobs[0].source).toBe(JobSourceType.ARBEITNOW);
    expect(jobs[0].remote).toBe(true);
    expect(jobs[0].url).toBe('https://www.arbeitnow.com/view/senior-nodejs-engineer');
    expect(jobs[0].description).toBe('Looking for a Node.js backend developer.');
    expect(jobs[0].skills).toEqual(['Node.js', 'TypeScript', 'Backend']);
  });

  it('should handle API failure gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });

  it('should handle non-200 responses gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
