import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TanqeebJobSource } from '../../src/modules/jobs/sources/tanqeeb.source.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('TanqeebJobSource', () => {
  let source: TanqeebJobSource;

  beforeEach(() => {
    source = new TanqeebJobSource();
    vi.restoreAllMocks();
  });

  it('should have type TANQEEB', () => {
    expect(source.type).toBe(JobSourceType.TANQEEB);
  });

  it('should parse HTML listings from Tanqeeb into normalized Job models', async () => {
    const mockHtml = `
      <div class="card-list-item">
        <h2 class="card-title">
          <a href="/jobs/12345/backend-developer">مطور باك إند (Node.js)</a>
        </h2>
        <span class="card-company">شركة التقنية المتقدمة</span>
        <span class="card-location">الرياض، السعودية</span>
        <p class="card-desc">مطلوب مطور باك إند للعمل عن بعد بنظام الدوام الكامل</p>
      </div>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const jobs = await source.fetchJobs({ jobTitle: 'backend' });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('مطور باك إند (Node.js)');
    expect(jobs[0].company).toBe('شركة التقنية المتقدمة');
    expect(jobs[0].location).toBe('الرياض، السعودية');
    expect(jobs[0].source).toBe(JobSourceType.TANQEEB);
    expect(jobs[0].url).toBe('https://www.tanqeeb.com/jobs/12345/backend-developer');
    expect(jobs[0].remote).toBe(true);
  });

  it('should handle scraping errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const jobs = await source.fetchJobs({ jobTitle: 'developer' });
    expect(jobs).toEqual([]);
  });
});
