import { describe, expect, it } from 'vitest';

import { formatJobMessage } from './job-message.formatter.js';

import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

import { JobSourceType } from '../../jobs/job.types.js';

import type { MatchedJob } from '../../matching/matching.service.js';

describe('formatJobMessage', () => {
  const createMatchedJob = (
    overrides: Partial<MatchedJob['job']> = {},
    score = 91,
  ): MatchedJob => ({
    job: {
      title: 'Junior Backend Developer',
      company: 'Example Company',
      source: JobSourceType.BAYT,
      applicationUrl: 'https://example.com/apply',
      location: 'Remote',
      country: 'Saudi Arabia',
      workType: WorkType.REMOTE,
      experienceLevel: ExperienceLevel.JUNIOR,
      skills: ['Node.js'],
      description: 'Backend developer position',
      publicationDate: new Date(),
      scrapedAt: new Date(),
      ...overrides,
    },
    score,
    reason: 'Strong match',
  });

  it('should format a complete job message', () => {
    const matchedJob = createMatchedJob();

    const message = formatJobMessage(matchedJob);

    expect(message).toContain('💼 Junior Backend Developer');
    expect(message).toContain('🏢 Company: Example Company');
    expect(message).toContain('🌍 Remote');
    expect(message).toContain('📍 Saudi Arabia');
    expect(message).toContain('🌐 Source: bayt');
    expect(message).toContain('🎯 Match: 91%');
  });

  it('should handle missing optional fields', () => {
    const matchedJob = createMatchedJob({
      location: undefined,
      country: undefined,
      workType: undefined,
    });

    const message = formatJobMessage(matchedJob);

    expect(message).not.toContain('undefined');
    expect(message).toContain('💼 Junior Backend Developer');
    expect(message).toContain('🏢 Company: Example Company');
    expect(message).toContain('🌐 Source: bayt');
    expect(message).toContain('🎯 Match: 91%');
  });

  it('should include only the available location information', () => {
    const matchedJob = createMatchedJob({
      location: undefined,
      country: 'Palestine',
    });

    const message = formatJobMessage(matchedJob);

    expect(message).not.toContain('🌍');
    expect(message).toContain('📍 Palestine');
  });

  it('should include only the available country information', () => {
    const matchedJob = createMatchedJob({
      location: 'Remote',
      country: undefined,
    });

    const message = formatJobMessage(matchedJob);

    expect(message).toContain('🌍 Remote');
    expect(message).not.toContain('📍');
  });

  it('should include the match score', () => {
    const matchedJob = createMatchedJob({}, 75);

    const message = formatJobMessage(matchedJob);

    expect(message).toContain('🎯 Match: 75%');
  });

  it('should include the job source', () => {
    const matchedJob = createMatchedJob({
      source: JobSourceType.LINKEDIN,
    });

    const message = formatJobMessage(matchedJob);

    expect(message).toContain('🌐 Source: linkedin');
  });

  it('should include the job title and company', () => {
    const matchedJob = createMatchedJob({
      title: 'Senior Node.js Developer',
      company: 'Tech Company',
    });

    const message = formatJobMessage(matchedJob);

    expect(message).toContain('💼 Senior Node.js Developer');
    expect(message).toContain('🏢 Company: Tech Company');
  });
});
