import { WorkType, ExperienceLevel } from '../../shared/types/job.js';

export enum JobSource {
  MOSTAQEL = 'mostaqel',
  BAEED = 'baeed',
  TAQNEEB = 'taqneeb',
  SOUQ = 'souq',
  BAYT = 'bayt',
  NARIGULF = 'narigulf',
  FREELANCER = 'freelancer',
  WE_WORK_REMOTELY = 'we_work_remotely',
  LINKEDIN = 'linkedin',
  OTHER = 'other',
}

export interface Job {
  title: string;
  company: string;
  source: JobSource;
  applicationUrl: string;

  location?: string;
  country?: string;

  workType?: WorkType;
  experienceLevel?: ExperienceLevel;

  description?: string;
  skills: string[];

  publicationDate: Date;
  scrapedAt: Date;
}

export interface JobSearchQuery {
  jobTitle: string;
  workType?: WorkType;
  experienceLevel?: ExperienceLevel;
  location?: string;
  skills?: string[];
}
