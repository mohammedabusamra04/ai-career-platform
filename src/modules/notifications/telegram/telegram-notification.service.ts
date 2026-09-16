import type { Bot } from 'grammy';

import type { MatchedJob } from '../../matching/matching.service.js';
import type { NotificationService } from '../notification.service.js';

import { formatJobMessage } from './job-message.formatter.js';

export type TelegramApi = Pick<Bot['api'], 'sendMessage'>;

export class TelegramNotificationService implements NotificationService {
  constructor(private readonly api: TelegramApi) {}

  async sendJob(chatId: number, matchedJob: MatchedJob): Promise<void> {
    const message = formatJobMessage(matchedJob);

    try {
      await this.api.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Apply Now',
                url: matchedJob.job.applicationUrl,
              },
            ],
          ],
        },
      });
    } catch (error) {
      console.error(`Failed to send job notification to chat ${chatId}:`, error);
    }
  }

  async sendNoJobsMatched(chatId: number): Promise<void> {
    const message =
      '🔍 No new jobs matching your preferences were found at the moment.\n\n' +
      "We'll keep searching and notify you in the next notification schedule as soon as suitable opportunities are available!";

    try {
      await this.api.sendMessage(chatId, message);
    } catch (error) {
      console.error(`Failed to send no-match notification to chat ${chatId}:`, error);
    }
  }

  async sendJobs(chatId: number, matchedJobs: MatchedJob[]): Promise<void> {
    if (matchedJobs.length === 0) {
      await this.sendNoJobsMatched(chatId);
      return;
    }

    for (const matchedJob of matchedJobs) {
      await this.sendJob(chatId, matchedJob);
    }
  }
}
