import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { WeWorkRemotelyJobSource } from './weworkremotely.source.js';
import { JobSourceType } from '../job.types.js';
import { WorkType } from '../../../shared/types/job.js';

describe('WeWorkRemotelyJobSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and parse RSS XML feed matching query keywords', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>We Work Remotely: Remote Programming Jobs</title>
    <link>https://weworkremotely.com</link>
    <item>
      <title><![CDATA[Stripe: Senior Node.js Backend Engineer]]></title>
      <link>https://weworkremotely.com/remote-jobs/stripe-senior-nodejs-backend-engineer</link>
      <pubDate>Tue, 08 Sep 2026 08:00:00 +0000</pubDate>
      <description><![CDATA[<p>Looking for an experienced <b>Node.js</b> engineer.</p>]]></description>
    </item>
    <item>
      <title><![CDATA[DesignCo: UI/UX Designer]]></title>
      <link>https://weworkremotely.com/remote-jobs/designco-uiux-designer</link>
      <pubDate>Tue, 08 Sep 2026 07:00:00 +0000</pubDate>
      <description><![CDATA[<p>Design UI layouts in Figma.</p>]]></description>
    </item>
  </channel>
</rss>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockRssXml),
    } as unknown as Response);

    const source = new WeWorkRemotelyJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Backend' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Senior Node.js Backend Engineer',
      company: 'Stripe',
      source: JobSourceType.WE_WORK_REMOTELY,
      applicationUrl: 'https://weworkremotely.com/remote-jobs/stripe-senior-nodejs-backend-engineer',
      workType: WorkType.REMOTE,
      location: 'Remote',
      description: 'Looking for an experienced Node.js engineer.',
    });
  });

  it('should return empty array when RSS request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const source = new WeWorkRemotelyJobSource();
    const jobs = await source.fetchJobs({ jobTitle: 'Python' });

    expect(jobs).toEqual([]);
  });
});
