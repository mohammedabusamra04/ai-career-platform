import type { Job } from '../jobs/job.types.js';

export interface DeduplicationResult {
  uniqueJobs: Job[];
  duplicateJobs: Job[];
}
