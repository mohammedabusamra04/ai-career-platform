import { createHash } from 'node:crypto';

import type { Job } from '../jobs/job.types.js';

export class FingerprintService {
  generate(job: Job): string {
    const normalizedTitle = job.title.trim().toLowerCase();
    const normalizedCompany = job.company.trim().toLowerCase();
    const normalizedUrl = job.applicationUrl.trim().toLowerCase();

    const data = `${normalizedTitle}|${normalizedCompany}|${normalizedUrl}`;

    return createHash('sha256').update(data).digest('hex');
  }
}
