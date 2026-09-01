import type { ExperienceLevel, WorkType } from '../../shared/types/job.js';

import { Job, JobSource } from './job.types.js';

export interface RawJob {
  title?: string;
  company?: string;
  source?: JobSource;
  applicationUrl?: string;

  location?: string;
  country?: string;

  workType?: WorkType;
  experienceLevel?: ExperienceLevel;

  description?: string;
  skills?: string[];

  publicationDate?: string | Date;
}

export function normalizeJob(rawJob: RawJob): Job {
  return {
    title: rawJob.title?.trim() ?? '',
    company: rawJob.company?.trim() ?? '',
    source: rawJob.source ?? JobSource.OTHER,
    applicationUrl: rawJob.applicationUrl?.trim() ?? '',

    location: rawJob.location?.trim(),
    country: rawJob.country?.trim(),

    workType: rawJob.workType,
    experienceLevel: rawJob.experienceLevel,

    description: rawJob.description?.trim(),
    skills: rawJob.skills ?? [],

    publicationDate: normalizeDate(rawJob.publicationDate),
    scrapedAt: new Date(),
  };
}

function normalizeDate(value?: string | Date): Date {
  if (!value) {
    return new Date();
  }

  return value instanceof Date ? value : new Date(value);
}
