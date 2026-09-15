import { describe, expect, it } from 'vitest';
import { cacheKeys } from '../../src/cache/cache.keys.js';

describe('cacheKeys', () => {
  it('should generate the correct job key', () => {
    expect(cacheKeys.job('abc123')).toBe('job:abc123');
  });

  it('should generate the correct jobs key', () => {
    expect(cacheKeys.jobs('backend-developer')).toBe('jobs:backend-developer');
  });

  it('should generate the correct preferences key', () => {
    expect(cacheKeys.preferences('123')).toBe('preferences:123');
  });

  it('should generate the correct fingerprint key', () => {
    expect(cacheKeys.fingerprint('abc123')).toBe('fingerprint:abc123');
  });

  it('should generate the correct userSentJob key', () => {
    expect(cacheKeys.userSentJob(12345, 'fp_xyz')).toBe('user:12345:sent:fp_xyz');
  });
});
