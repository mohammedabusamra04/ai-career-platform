import type { PrismaClient, Job as PrismaJobRecord } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../shared/database/prisma.service.js';
import type {
  IJobRepository,
  JobEntity,
  NormalizedJobInput,
} from './job.repository.interface.js';

export class PrismaJobRepository implements IJobRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  public async upsertJob(jobData: NormalizedJobInput): Promise<JobEntity> {
    const now = new Date();

    const record = await this.db.$transaction(async (tx) => {
      const existing = await tx.job.findUnique({
        where: {
          deduplicationKey: jobData.deduplicationKey,
        },
      });

      if (!existing) {
        return tx.job.create({
          data: {
            deduplicationKey: jobData.deduplicationKey,
            semanticKey: jobData.semanticKey,
            title: jobData.title,
            company: jobData.company,
            source: jobData.source,
            url: jobData.url,
            applicationUrl: jobData.applicationUrl ?? null,
            location: jobData.location ?? null,
            country: jobData.country ?? null,
            remoteScope: jobData.remoteScope ?? 'UNKNOWN',
            primarySpecialization: jobData.primarySpecialization,
            secondarySpecialization: jobData.secondarySpecialization ?? null,
            experienceLevel: jobData.experienceLevel ?? 'UNKNOWN',
            workType: jobData.workType ?? 'UNKNOWN',
            description: jobData.description,
            skills: jobData.skills ?? [],
            salaryMin: jobData.salaryMin ?? null,
            salaryMax: jobData.salaryMax ?? null,
            currency: jobData.currency ?? null,
            publishedAt: jobData.publishedAt,
            scrapedAt: jobData.scrapedAt ?? now,
            lastSeenAt: jobData.lastSeenAt ?? now,
            status: jobData.status ?? 'ACTIVE',
          },
        });
      }

      // Merge data preserving richer non-null fields
      const mergedDescription =
        jobData.description && jobData.description.trim().length > 0
          ? jobData.description
          : existing.description;

      const mergedSkills =
        jobData.skills && jobData.skills.length > 0
          ? Array.from(new Set([...existing.skills, ...jobData.skills]))
          : existing.skills;

      const mergedRemoteScope =
        jobData.remoteScope && jobData.remoteScope !== 'UNKNOWN'
          ? jobData.remoteScope
          : existing.remoteScope;

      const mergedExperienceLevel =
        jobData.experienceLevel && jobData.experienceLevel !== 'UNKNOWN'
          ? jobData.experienceLevel
          : existing.experienceLevel;

      const mergedWorkType =
        jobData.workType && jobData.workType !== 'UNKNOWN'
          ? jobData.workType
          : existing.workType;

      return tx.job.update({
        where: {
          deduplicationKey: jobData.deduplicationKey,
        },
        data: {
          title: jobData.title || existing.title,
          company: jobData.company || existing.company,
          source: jobData.source || existing.source,
          url: jobData.url || existing.url,
          applicationUrl: jobData.applicationUrl ?? existing.applicationUrl,
          location: jobData.location ?? existing.location,
          country: jobData.country ?? existing.country,
          remoteScope: mergedRemoteScope,
          primarySpecialization: jobData.primarySpecialization || existing.primarySpecialization,
          secondarySpecialization:
            jobData.secondarySpecialization ?? existing.secondarySpecialization,
          experienceLevel: mergedExperienceLevel,
          workType: mergedWorkType,
          description: mergedDescription,
          skills: mergedSkills,
          salaryMin: jobData.salaryMin ?? existing.salaryMin,
          salaryMax: jobData.salaryMax ?? existing.salaryMax,
          currency: jobData.currency ?? existing.currency,
          lastSeenAt: jobData.lastSeenAt ?? now,
        },
      });
    });

    return this.mapToEntity(record);
  }

  public async findById(id: string): Promise<JobEntity | null> {
    const record = await this.db.job.findUnique({
      where: { id },
    });

    return record ? this.mapToEntity(record) : null;
  }

  public async findByDeduplicationKey(deduplicationKey: string): Promise<JobEntity | null> {
    const record = await this.db.job.findUnique({
      where: { deduplicationKey },
    });

    return record ? this.mapToEntity(record) : null;
  }

  public async count(): Promise<number> {
    return this.db.job.count();
  }

  private mapToEntity(row: PrismaJobRecord): JobEntity {
    return {
      id: row.id,
      deduplicationKey: row.deduplicationKey,
      semanticKey: row.semanticKey,
      title: row.title,
      company: row.company,
      source: row.source,
      url: row.url,
      applicationUrl: row.applicationUrl,
      location: row.location,
      country: row.country,
      remoteScope: row.remoteScope,
      primarySpecialization: row.primarySpecialization,
      secondarySpecialization: row.secondarySpecialization,
      experienceLevel: row.experienceLevel,
      workType: row.workType,
      description: row.description,
      skills: row.skills,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      currency: row.currency,
      publishedAt: row.publishedAt,
      scrapedAt: row.scrapedAt,
      lastSeenAt: row.lastSeenAt,
      status: row.status,
    };
  }
}

export const jobRepository = new PrismaJobRepository();
