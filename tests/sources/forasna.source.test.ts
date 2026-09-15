import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForasnaJobSource } from '../../src/modules/jobs/sources/forasna.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('ForasnaJobSource', () => {
  let source: ForasnaJobSource;

  beforeEach(() => {
    source = new ForasnaJobSource();
    vi.restoreAllMocks();
  });

  it('should have type FORASNA', () => {
    expect(source.type).toBe(JobSourceType.FORASNA);
  });

  it('should parse Forasna HTML listings correctly', async () => {
    const mockHtml = `
      <div class="job-card">
        <h2><a href="/jobs/456-sales">IT Support Specialist</a></h2>
        <span class="company">Alexandria Systems</span>
        <span class="location">Alexandria, Egypt</span>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'IT Support' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'IT Support Specialist',
      company: 'Alexandria Systems',
      source: JobSourceType.FORASNA,
      applicationUrl: 'https://forasna.com/jobs/456-sales',
      url: 'https://forasna.com/jobs/456-sales',
      location: 'Alexandria, Egypt',
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Blocked'));
    const jobs = await source.fetchJobs({ jobTitle: 'support' });
    expect(jobs).toEqual([]);
  });
});
