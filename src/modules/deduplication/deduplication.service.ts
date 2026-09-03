import type { Job } from '../jobs/job.types.js';
import type { Cache } from '../../cache/cache.interface.js';
import { cacheKeys } from '../../cache/cache.keys.js';
import { CACHE_TTL } from '../../cache/cache.ttl.js';
import type { DeduplicationResult } from './deduplication.types.js';
import { FingerprintService } from './fingerprint.service.js';

export class DeduplicationService {
  constructor(
    private readonly fingerprintService: FingerprintService,
    private readonly cache: Cache,
  ) {}

  async deduplicate(jobs: Job[]): Promise<DeduplicationResult> {
    const uniqueJobsByFingerprint = new Map<string, Job>();
    const duplicateJobs: Job[] = [];

    for (const job of jobs) {
      const fingerprint = this.fingerprintService.generate(job);
      const key = cacheKeys.fingerprint(fingerprint);

      const exists = await this.cache.get<boolean>(key);
      const existingJob = uniqueJobsByFingerprint.get(fingerprint);

      if (exists || existingJob) {
        if (existingJob && this.scoreJob(job) > this.scoreJob(existingJob)) {
          uniqueJobsByFingerprint.set(fingerprint, job);
        }

        duplicateJobs.push(job);
        continue;
      }

      uniqueJobsByFingerprint.set(fingerprint, job);

      await this.cache.set(key, true, CACHE_TTL.FINGERPRINT);
    }

    return {
      uniqueJobs: [...uniqueJobsByFingerprint.values()],
      duplicateJobs,
    };
  }

  private scoreJob(job: Job): number {
    let score = 0;

    if (job.description) score++;
    if (job.location) score++;
    if (job.country) score++;
    if (job.workType) score++;
    if (job.experienceLevel) score++;

    score += job.skills.length;

    return score;
  }
}
