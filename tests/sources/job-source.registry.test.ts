import { describe, it, expect } from 'vitest';
import { JobSourceRegistry } from '../../src/modules/jobs/sources/job-source.registry.js';
import type { JobSource } from '../../src/modules/jobs/sources/job-source.interface.js';
import { JobSourceType } from '../../src/modules/jobs/job.types.js';

describe('JobSourceRegistry', () => {
  it('should register and retrieve job sources', () => {
    const registry = new JobSourceRegistry();
    const mockSource: JobSource = {
      type: JobSourceType.ARBEITNOW,
      fetchJobs: async () => [],
    };

    registry.register(mockSource);
    expect(registry.getSources()).toHaveLength(1);
    expect(registry.getSources()[0].type).toBe(JobSourceType.ARBEITNOW);
  });
});
