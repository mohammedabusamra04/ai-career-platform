import type { Job, JobSearchQuery } from '../job.types.js';
import { JobSourceType } from '../job.types.js';
import type { JobSource } from './job-source.interface.js';
import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

interface JSearchJobItem {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_city?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_description?: string;
  job_posted_at_datetime_utc?: string;
  job_required_skills?: string[];
}

interface JSearchApiResponse {
  status?: string;
  data?: JSearchJobItem[];
}

export class LinkedinJobSource implements JobSource {
  public readonly type = JobSourceType.LINKEDIN;

  constructor(private readonly apiKey: string) {}

  async fetchJobs(query: JobSearchQuery): Promise<Job[]> {
    if (!this.apiKey) {
      return [];
    }

    const searchQuery = [query.jobTitle, query.location || 'Remote']
      .filter(Boolean)
      .join(' in ');

    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
      searchQuery,
    )}&page=1&num_pages=1&date_posted=today`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as JSearchApiResponse;

      if (!data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((item) => this.mapToJob(item, query));
    } catch {
      return [];
    }
  }

  private mapToJob(item: JSearchJobItem, query: JobSearchQuery): Job {
    const pubDate = item.job_posted_at_datetime_utc
      ? new Date(item.job_posted_at_datetime_utc)
      : new Date();
    const validPubDate = Number.isNaN(pubDate.getTime()) ? new Date() : pubDate;

    return {
      title: item.job_title || query.jobTitle,
      company: item.employer_name || 'LinkedIn Employer',
      source: JobSourceType.LINKEDIN,
      applicationUrl:
        item.job_apply_link || item.job_google_link || 'https://www.linkedin.com/jobs',
      location: item.job_city || (item.job_is_remote ? 'Remote' : 'Worldwide'),
      country: item.job_country || undefined,
      workType: item.job_is_remote ? WorkType.REMOTE : query.workType || WorkType.ON_SITE,
      experienceLevel: query.experienceLevel || ExperienceLevel.MID,
      description: item.job_description || item.job_title || '',
      skills: Array.isArray(item.job_required_skills) ? item.job_required_skills : query.skills || [],
      publicationDate: validPubDate,
      scrapedAt: new Date(),
    };
  }
}
