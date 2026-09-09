import * as cheerio from 'cheerio';

import type { Job, JobSearchQuery } from '../job.types.js';
import { JobSourceType } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

/**
 * Scrapes Forasna search results.
 * Selectors adapted from Daily_Jobs_Bot tools/forasnaJobs.js.
 * Note: Forasna is stronger for general/manual roles than pure tech roles.
 */
export class ForasnaJobSource implements JobSource {
  public readonly type = JobSourceType.FORASNA;

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    const url = `https://forasna.com/jobs/search?q=${encodeURIComponent(query.jobTitle.trim())}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
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
    const $ = cheerio.load(html);
    const jobs: Job[] = [];

    $('.job-card, .job-item, div[class*="job-listing"]').each((_, el) => {
      if (jobs.length >= 15) {
        return;
      }

      const titleEl = $(el).find('h2 a, h3 a, a[class*="title"]').first();
      const title = titleEl.text().trim();
      let link = titleEl.attr('href');
      if (link && !link.startsWith('http')) {
        link = `https://forasna.com${link}`;
      }

      const company =
        $(el).find('[class*="company"], .employer-name').first().text().trim() ||
        'فرصنا Employer';

      const location =
        $(el).find('[class*="location"]').first().text().trim() ||
        query.location ||
        'Egypt';

      if (!title || !link) {
        return;
      }

      jobs.push({
        title,
        company,
        source: JobSourceType.FORASNA,
        applicationUrl: link,
        location,
        country: location,
        workType: query.workType || WorkType.ON_SITE,
        experienceLevel: query.experienceLevel || ExperienceLevel.MID,
        description: `${title} at ${company} in ${location}`,
        skills: query.skills || [],
        publicationDate: new Date(),
        scrapedAt: new Date(),
      });
    });

    return jobs;
  }
}
