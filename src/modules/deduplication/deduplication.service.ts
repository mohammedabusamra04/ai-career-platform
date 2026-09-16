import type { Job } from '../jobs/job.types.js';
import type { Cache } from '../../cache/cache.interface.js';
import type { DeduplicationResult } from './deduplication.types.js';
import { FingerprintService } from './fingerprint.service.js';

export class DeduplicationService {
  constructor(
    private readonly fingerprintService: FingerprintService,
    _cache?: Cache,
  ) {}

  async deduplicate(jobs: Job[]): Promise<DeduplicationResult> {
    const uniqueJobsByFingerprint = new Map<string, Job>();
    const seenSemanticKeys = new Map<string, string>(); // semanticKey -> primaryFingerprint
    const duplicateJobs: Job[] = [];

    for (const job of jobs) {
      const fingerprint = this.fingerprintService.generate(job);
      const semanticKey = this.fingerprintService.generateSemanticFingerprint(job);

      const existingByPrimary = uniqueJobsByFingerprint.get(fingerprint);
      const existingPrimaryForSemantic = seenSemanticKeys.get(semanticKey);
      const existingBySemantic = existingPrimaryForSemantic
        ? uniqueJobsByFingerprint.get(existingPrimaryForSemantic)
        : undefined;

      const existingJob = existingByPrimary || existingBySemantic;

      if (existingJob) {
        if (this.scoreJob(job) > this.scoreJob(existingJob)) {
          // Replace with higher quality job data
          const oldFingerprint = this.fingerprintService.generate(existingJob);
          uniqueJobsByFingerprint.delete(oldFingerprint);
          uniqueJobsByFingerprint.set(fingerprint, job);
          seenSemanticKeys.set(semanticKey, fingerprint);
        }

        duplicateJobs.push(job);
        continue;
      }

      uniqueJobsByFingerprint.set(fingerprint, job);
      seenSemanticKeys.set(semanticKey, fingerprint);
    }

    return {
      uniqueJobs: [...uniqueJobsByFingerprint.values()],
      duplicateJobs,
    };
  }

  private scoreJob(job: Job): number {
    let score = 0;

    if (job.description && job.description.length > 20) score += 2;
    if (job.location) score++;
    if (job.country) score++;
    if (job.workType) score++;
    if (job.experienceLevel) score++;
    if (job.salaryMin || job.salaryMax) score += 2;
    if (job.remote) score++;

    score += job.skills.length;

    return score;
  }
}
