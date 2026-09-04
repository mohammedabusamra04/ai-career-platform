import { describe, expect, it, vi } from 'vitest';

import { JobSourceType } from '../../jobs/job.types.js';
import type { Job } from '../../jobs/job.types.js';

import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

import type { UserPreferences } from '../../preferences/preference.types.js';

import { AIProviderError } from './ai-provider.error.js';
import { GeminiProvider } from './gemini.provider.js';

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: generateContentMock,
    };
  },
}));

const preferences: UserPreferences = {
  jobTitle: 'Backend Developer',
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.JUNIOR,
  location: 'Palestine',
  skills: ['Node.js', 'TypeScript'],
};

const job: Job = {
  title: 'Backend Developer',
  company: 'Test Company',
  source: JobSourceType.OTHER,
  applicationUrl: 'https://example.com',
  location: 'Palestine',
  country: 'Palestine',
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.JUNIOR,
  description: 'Backend development using Node.js and TypeScript.',
  skills: ['Node.js', 'TypeScript'],
  publicationDate: new Date(),
  scrapedAt: new Date(),
};

describe('GeminiProvider', () => {
  it('should return a valid matching result', async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        score: 90,
        reason: 'Strong match',
      }),
    });

    const provider = new GeminiProvider();

    const result = await provider.match({
      job,
      preferences,
    });

    expect(result).toEqual({
      score: 90,
      reason: 'Strong match',
    });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('should throw AIProviderError for invalid JSON', async () => {
    generateContentMock.mockResolvedValue({
      text: 'invalid json',
    });

    const provider = new GeminiProvider();

    await expect(
      provider.match({
        job,
        preferences,
      }),
    ).rejects.toThrow(AIProviderError);
  });

  it('should throw AIProviderError for invalid score', async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        score: 150,
        reason: 'Strong match',
      }),
    });

    const provider = new GeminiProvider();

    await expect(
      provider.match({
        job,
        preferences,
      }),
    ).rejects.toThrow(AIProviderError);
  });

  it('should throw AIProviderError for invalid reason', async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        score: 90,
        reason: 123,
      }),
    });

    const provider = new GeminiProvider();

    await expect(
      provider.match({
        job,
        preferences,
      }),
    ).rejects.toThrow(AIProviderError);
  });

  it('should throw AIProviderError for an empty response', async () => {
    generateContentMock.mockResolvedValue({
      text: undefined,
    });

    const provider = new GeminiProvider();

    await expect(
      provider.match({
        job,
        preferences,
      }),
    ).rejects.toThrow(AIProviderError);
  });

  it('should throw AIProviderError when Gemini API fails', async () => {
    generateContentMock.mockRejectedValue(new Error('Gemini API failed'));

    const provider = new GeminiProvider();

    await expect(
      provider.match({
        job,
        preferences,
      }),
    ).rejects.toThrow(AIProviderError);
  });
});
