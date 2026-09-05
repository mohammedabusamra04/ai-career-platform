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

  async sendJobs(chatId: number, matchedJobs: MatchedJob[]): Promise<void> {
    for (const matchedJob of matchedJobs) {
      await this.sendJob(chatId, matchedJob);
    }
  }
}
