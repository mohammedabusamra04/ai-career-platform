import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ForasnaJobSource } from './forasna.source.js';
import { JobSourceType } from '../job.types.js';

describe('ForasnaJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and parse Forasna job listings', async () => {
    const mockHtml = `
      <div class="job-card">
        <h2><a class="job-title" href="/jobs/456-sales">Sales Representative</a></h2>
        <div class="company-name">Retail Co</div>
        <div class="job-location">Alexandria</div>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockHtml),
    } as unknown as Response);

    const source = new ForasnaJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Sales' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Sales Representative',
      company: 'Retail Co',
      source: JobSourceType.FORASNA,
      applicationUrl: 'https://forasna.com/jobs/456-sales',
      location: 'Alexandria',
    });
  });

  it('should return empty array on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const source = new ForasnaJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Driver' });

    expect(jobs).toEqual([]);
  });
});
