/**
 * TASK-27.1: Text Sanitization & Safe HTML Stripping
 * Integrates sanitized text, clean URLs, and stripped HTML into Job Normalizer.
 */

import type { ExperienceLevel, WorkType } from '../../shared/types/job.js';

import { Job, JobSourceType } from './job.types.js';
import {
  stripHtml,
  cleanUrl,
  sanitizeSingleLine,
} from './job.sanitizer.js';

export interface RawJob {
  title?: string;
  company?: string;
  source?: JobSourceType | string;
  applicationUrl?: string;
  url?: string;

  location?: string;
  country?: string;
  remote?: boolean;

  workType?: WorkType;
  experienceLevel?: ExperienceLevel;

  description?: string;
  skills?: string[];

  publicationDate?: string | Date;
  publishedAt?: string | Date;

  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
}

export function normalizeJob(rawJob: RawJob): Job {
  const applicationUrl =
    cleanUrl(rawJob.applicationUrl || rawJob.url) ||
    (rawJob.applicationUrl || rawJob.url || '').trim();
  const pubDate = normalizeDate(rawJob.publishedAt || rawJob.publicationDate);
  const cleanDescription = rawJob.description
    ? stripHtml(rawJob.description)
    : undefined;

  const isRemote =
    rawJob.remote ??
    (rawJob.workType === 'remote' ||
      /remote|عن بعد|telecommute/i.test(`${rawJob.title ?? ''} ${rawJob.location ?? ''}`));

  return {
    title: sanitizeSingleLine(rawJob.title),
    company: sanitizeSingleLine(rawJob.company),
    source: rawJob.source ?? JobSourceType.OTHER,
    applicationUrl,
    url: applicationUrl,

    location: rawJob.location?.trim(),
    country: rawJob.country?.trim(),
    remote: isRemote,

    workType: rawJob.workType,
    experienceLevel: rawJob.experienceLevel,

    description: cleanDescription,
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : [],

    publicationDate: pubDate,
    publishedAt: pubDate,

    salaryMin: typeof rawJob.salaryMin === 'number' ? rawJob.salaryMin : undefined,
    salaryMax: typeof rawJob.salaryMax === 'number' ? rawJob.salaryMax : undefined,
    currency: rawJob.currency?.trim(),

    scrapedAt: new Date(),
  };
}

function normalizeDate(value?: string | Date): Date {
  if (!value) {
    return new Date();
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
