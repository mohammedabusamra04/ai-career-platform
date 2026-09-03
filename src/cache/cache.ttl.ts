import ms from 'ms';

export const CACHE_TTL = {
  JOB: ms('24h') / 1000,
  PREFERENCES: ms('24h') / 1000,
  FINGERPRINT: ms('24h') / 1000,
};