import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeWorkRemotelyJobSource } from '../../src/modules/jobs/sources/weworkremotely.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';
import { WorkType } from '../../src/shared/types/job.js';

describe('WeWorkRemotelyJobSource', () => {
  let source: WeWorkRemotelyJobSource;

  beforeEach(() => {
    source = new WeWorkRemotelyJobSource();
    vi.restoreAllMocks();
  });

  it('should have type WE_WORK_REMOTELY', () => {
    expect(source.type).toBe(JobSourceType.WE_WORK_REMOTELY);
  });

  it('should parse RSS feed XML and map jobs correctly', async () => {
    const mockRssXml = `
      <rss version="2.0">
        <channel>
          <title>We Work Remotely</title>
          <item>
            <title><![CDATA[Stripe: Senior Node.js Backend Engineer]]></title>
            <link>https://weworkremotely.com/remote-jobs/stripe-senior-nodejs-backend-engineer</link>
            <pubDate>Mon, 02 Mar 2026 12:00:00 +0000</pubDate>
            <description><![CDATA[<p>We are looking for a Node.js engineer to build payments.</p>]]></description>
          </item>
        </channel>
      </rss>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockRssXml,
    });

    const jobs = await source.fetchJobs({
      jobTitle: 'Node.js',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Node.js Backend Engineer',
      company: 'Stripe',
      source: JobSourceType.WE_WORK_REMOTELY,
      applicationUrl:
        'https://weworkremotely.com/remote-jobs/stripe-senior-nodejs-backend-engineer',
      url: 'https://weworkremotely.com/remote-jobs/stripe-senior-nodejs-backend-engineer',
      location: 'Remote',
      remote: true,
      workType: WorkType.REMOTE,
      description: 'We are looking for a Node.js engineer to build payments.',
    });
  });

  it('should handle XML fetch failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
