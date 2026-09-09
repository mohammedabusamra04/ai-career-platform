import * as cheerio from 'cheerio';

import type { Job, JobSearchQuery } from '../job.types.js';
import { JobSourceType } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

/**
 * Scrapes Wuzzuf search results.
 * Selectors adapted from Daily_Jobs_Bot tools/wuzzufJobs.js.
 */
export class WuzzufJobSource implements JobSource {
  public readonly type = JobSourceType.WUZZUF;

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    const url = `https://wuzzuf.net/search/jobs/?q=${encodeURIComponent(query.jobTitle.trim())}`;

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

    $('div.css-1gatmva, div[class*="job"], .css-1lh32fc').each((_, el) => {
      if (jobs.length >= 15) {
        return;
      }

      const titleEl = $(el).find('h2 a, a.css-o171kl, a[class*="title"]').first();
      const title = titleEl.text().trim();
      let link = titleEl.attr('href');
      if (link && !link.startsWith('http')) {
        link = `https://wuzzuf.net${link}`;
      }

      const company =
        $(el).find('a.css-ipsyv7, a[class*="company"], .css-d7j1kk').first().text().trim() ||
        'Wuzzuf Employer';

      const location =
        $(el).find('span.css-5wys0k, span[class*="location"]').first().text().trim() ||
        query.location ||
        'Egypt';

      if (!title || !link) {
        return;
      }

      jobs.push({
        title,
        company,
        source: JobSourceType.WUZZUF,
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
