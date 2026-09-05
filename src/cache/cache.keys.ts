export const cacheKeys = {
  job: (fingerprint: string) => `job:${fingerprint}`,

  jobs: (query: string) => `jobs:${query}`,

  preferences: (userId: string) => `preferences:${userId}`,

  fingerprint: (fingerprint: string) => `fingerprint:${fingerprint}`,

  subscriptionStatus: (userId: string) => `subscription:${userId}`,
};
