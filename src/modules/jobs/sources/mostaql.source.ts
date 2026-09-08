import type { Job, JobSearchQuery } from '../job.types.js';
import { JobSourceType } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

export class MostaqlJobSource implements JobSource {
  public readonly type = JobSourceType.MOSTAQEL;

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    const searchKeyword = query.jobTitle.trim();
    const url = `https://mostaql.com/projects?keyword=${encodeURIComponent(searchKeyword)}`;

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
      return this.parseProjects(html, query);
    } catch {
      return [];
    }
  }

  private parseProjects(html: string, query: JobSearchQuery): Job[] {
    const jobs: Job[] = [];
    const titleRegex =
      /<h2[^>]*class="[^"]*card--title[^"]*"[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = titleRegex.exec(html)) !== null && jobs.length < 15) {
      const link = match[1]?.startsWith('http') ? match[1] : `https://mostaql.com${match[1]}`;
      const title = (match[2] || '').replace(/<[^>]*>?/gm, '').trim();

      if (!title || !link) {
        continue;
      }

      const remainingHtml = html.slice(match.index, match.index + 800);
      const descMatch = /<p[^>]*class="[^"]*project__brief[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(
        remainingHtml,
      );
      const description = descMatch ? descMatch[1].replace(/<[^>]*>?/gm, '').trim() : title;

      jobs.push({
        title,
        company: 'مستقل (مشروع فريلانس)',
        source: JobSourceType.MOSTAQEL,
        applicationUrl: link,
        location: 'عن بعد (Freelance)',
        country: 'الشرق الأوسط / عن بعد',
        workType: WorkType.REMOTE,
        experienceLevel: query.experienceLevel || ExperienceLevel.MID,
        description: description || title,
        skills: query.skills || [],
        publicationDate: new Date(),
        scrapedAt: new Date(),
      });
    }

    return jobs;
  }
}
