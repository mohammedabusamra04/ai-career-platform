import ms from 'ms';

export const CACHE_TTL = {
  JOB: ms('24h') / 1000,
  // Preferences must outlive daily runs; 24h caused silent skips after one day.
  PREFERENCES: ms('90d') / 1000,
  FINGERPRINT: ms('24h') / 1000,
};
