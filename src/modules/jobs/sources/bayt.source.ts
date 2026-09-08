import type { Job, JobSearchQuery } from '../job.types.js';
import { JobSourceType } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

export class BaytJobSource implements JobSource {
  public readonly type = JobSourceType.BAYT;

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    const formattedTitle = query.jobTitle.trim().toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.bayt.com/en/international/jobs/${encodeURIComponent(formattedTitle)}-jobs/`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml',
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      return this.parseJobs(html, query);
    } catch {
      return [];
    }
  }

  private parseJobs(html: string, query: JobSearchQuery): Job[] {
    const jobs: Job[] = [];
    const titleRegex = /<h2[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = titleRegex.exec(html)) !== null && jobs.length < 15) {
      const rawLink = match[1];
      const link = rawLink?.startsWith('http') ? rawLink : `https://www.bayt.com${rawLink}`;
      const title = (match[2] || '').replace(/<[^>]*>?/gm, '').trim();

      if (!title || !link) {
        continue;
      }

      const remainingHtml = html.slice(match.index, match.index + 800);
      const companyMatch = /<b[^>]*class="[^"]*t-nowrap[^"]*"[^>]*>([\s\S]*?)<\/b>/i.exec(
        remainingHtml,
      );
      const locationMatch = /<span[^>]*class="[^"]*t-mute[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(
        remainingHtml,
      );

      const company = companyMatch
        ? companyMatch[1].replace(/<[^>]*>?/gm, '').trim()
        : 'Bayt Employer';
      const location = locationMatch
        ? locationMatch[1].replace(/<[^>]*>?/gm, '').trim()
        : 'Middle East';

      jobs.push({
        title,
        company,
        source: JobSourceType.BAYT,
        applicationUrl: link,
        location: location || query.location || 'Middle East',
        country: location || undefined,
        workType: query.workType || WorkType.REMOTE,
        experienceLevel: query.experienceLevel || ExperienceLevel.MID,
        description: `${title} at ${company} in ${location}`,
        skills: query.skills || [],
        publicationDate: new Date(),
        scrapedAt: new Date(),
      });
    }

    return jobs;
  }
}
