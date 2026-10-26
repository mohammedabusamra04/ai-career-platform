import type {
  JobStatus,
  RemoteScope,
  Specialization,
  ExperienceLevel,
  WorkType,
} from '@prisma/client';

export interface JobEntity {
  id: string;
  deduplicationKey: string;
  semanticKey: string;
  title: string;
  company: string;
  source: string;
  url: string;
  applicationUrl: string | null;
  location: string | null;
  country: string | null;
  remoteScope: RemoteScope;
  primarySpecialization: Specialization;
  secondarySpecialization: Specialization | null;
  experienceLevel: ExperienceLevel;
  workType: WorkType;
  description: string;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  publishedAt: Date;
  scrapedAt: Date;
  lastSeenAt: Date;
  status: JobStatus;
}

export interface NormalizedJobInput {
  deduplicationKey: string;
  semanticKey: string;
  title: string;
  company: string;
  source: string;
  url: string;
  applicationUrl?: string | null;
  location?: string | null;
  country?: string | null;
  remoteScope?: RemoteScope;
  primarySpecialization: Specialization;
  secondarySpecialization?: Specialization | null;
  experienceLevel?: ExperienceLevel;
  workType?: WorkType;
  description: string;
  skills?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  publishedAt: Date;
  scrapedAt?: Date;
  lastSeenAt?: Date;
  status?: JobStatus;
}

export interface IJobRepository {
  upsertJob(jobData: NormalizedJobInput): Promise<JobEntity>;
  findById(id: string): Promise<JobEntity | null>;
  findByDeduplicationKey(deduplicationKey: string): Promise<JobEntity | null>;
  count(): Promise<number>;
}
