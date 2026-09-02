import { describe, expect, it } from 'vitest';

import { JobSourceRegistry } from './index.js';
import { JobSourceType } from '../job.types.js';

describe('JobSourceRegistry', () => {
  it('should register and return sources', () => {
    const registry = new JobSourceRegistry();

    const baytSource = {
      type: JobSourceType.BAYT,
      fetchJobs: async () => [],
    };

    registry.register(baytSource);

    expect(registry.getSources()).toEqual([baytSource]);
  });

  it('should register multiple sources', () => {
    const registry = new JobSourceRegistry();

    const baytSource = {
      type: JobSourceType.BAYT,
      fetchJobs: async () => [],
    };

    const baeedSource = {
      type: JobSourceType.BAEED,
      fetchJobs: async () => [],
    };

    registry.register(baytSource);
    registry.register(baeedSource);

    expect(registry.getSources()).toEqual([baytSource, baeedSource]);
  });

  it('should return a copy of the sources', () => {
    const registry = new JobSourceRegistry();

    const baytSource = {
      type: JobSourceType.BAYT,
      fetchJobs: async () => [],
    };

    registry.register(baytSource);

    const sources = registry.getSources();
    sources.pop();

    expect(registry.getSources()).toEqual([baytSource]);
  });
});
