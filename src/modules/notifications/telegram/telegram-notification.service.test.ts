import { describe, expect, it, vi } from 'vitest';

import { TelegramNotificationService } from './telegram-notification.service.js';

import { ExperienceLevel, WorkType } from '../../../shared/types/job.js';

import { JobSourceType } from '../../jobs/job.types.js';

import type { MatchedJob } from '../../matching/matching.service.js';
import type { TelegramApi } from './telegram-notification.service.js';

describe('TelegramNotificationService', () => {
  const createMatchedJob = (): MatchedJob => ({
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
    },
    score: 91,
    reason: 'Strong match',
  });

  it('should send a job notification to the correct chat', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    const api: TelegramApi = {
      sendMessage,
    };

    const service = new TelegramNotificationService(api);

    await service.sendJob(123456, createMatchedJob());

    expect(sendMessage).toHaveBeenCalledTimes(1);

    expect(sendMessage).toHaveBeenCalledWith(
      123456,
      expect.stringContaining('Junior Backend Developer'),
      expect.any(Object),
    );
  });

  it('should include an Apply Now button with the application link', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    const api: TelegramApi = {
      sendMessage,
    };

    const service = new TelegramNotificationService(api);

    await service.sendJob(123456, createMatchedJob());

    expect(sendMessage).toHaveBeenCalledWith(123456, expect.any(String), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Apply Now',
              url: 'https://example.com/apply',
            },
          ],
        ],
      },
    });
  });

  it('should handle Telegram API failures safely', async () => {
    const error = new Error('Telegram API unavailable');

    const sendMessage = vi.fn().mockRejectedValue(error);

    const api: TelegramApi = {
      sendMessage,
    };

    const service = new TelegramNotificationService(api);

    await expect(service.sendJob(123456, createMatchedJob())).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
  it('should send all matched jobs even if one fails', async () => {
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Telegram API unavailable'))
      .mockResolvedValueOnce(undefined);

    const api: TelegramApi = {
      sendMessage,
    };

    const service = new TelegramNotificationService(api);

    const matchedJobs = [createMatchedJob(), createMatchedJob(), createMatchedJob()];

    await service.sendJobs(123456, matchedJobs);

    expect(sendMessage).toHaveBeenCalledTimes(3);
  });
});
