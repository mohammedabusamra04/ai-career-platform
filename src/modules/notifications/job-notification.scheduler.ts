import { NotificationScheduleService } from './notification.schedule.js';

import type { UserPreferences } from '../preferences/preference.types.js';
import logger from '../../shared/utils/logger.js';
interface NotificationRunner {
  run(): Promise<void>;
  runForUser(userId: number): Promise<void>;
}

interface SubscriptionReader {
  getSubscribedUsers(): Promise<number[]>;
}

interface PreferenceReader {
  getPreferences(userId: number): Promise<UserPreferences | null>;
}

export class JobNotificationScheduler {
  private timeoutId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly notificationService: NotificationRunner,
    private readonly scheduleService: NotificationScheduleService,
    private readonly subscriptionService: SubscriptionReader,
    private readonly preferenceService: PreferenceReader,
  ) {}

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    void this.scheduleNextRun();
  }

  private async runDueNotifications(): Promise<void> {
    const now = new Date();

    const subscribers = await this.subscriptionService.getSubscribedUsers();

    console.log(`Scheduler: ${subscribers.length} subscribed users`);

    for (const userId of subscribers) {
      const preferences = await this.preferenceService.getPreferences(userId);

      if (!preferences) {
        continue;
      }

      const isDue = this.scheduleService.isNotificationDue(
        preferences.timezone,
        preferences.notificationTimes,
        now,
      );

      if (!isDue) {
        continue;
      }

      await this.notificationService.runForUser(userId);
    }
  }

  private async scheduleNextRun(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const now = new Date();

    const subscribers = await this.subscriptionService.getSubscribedUsers();

    const nextRuns: Date[] = [];

    for (const userId of subscribers) {
      const preferences = await this.preferenceService.getPreferences(userId);

      if (!preferences) {
        continue;
      }

      const nextRun = this.scheduleService.getNextNotificationTime(
        preferences.timezone,
        preferences.notificationTimes,
        now,
      );

      nextRuns.push(nextRun);
    }

    if (!this.isRunning || nextRuns.length === 0) {
      return;
    }

    const nextRun = new Date(Math.min(...nextRuns.map((date) => date.getTime())));

    const delayMs = nextRun.getTime() - now.getTime();

    this.timeoutId = setTimeout(async () => {
      this.timeoutId = undefined;

      if (!this.isRunning) {
        return;
      }

      try {
        await this.runDueNotifications();
      } catch (error) {
        logger.error(
          `Failed to run scheduled notifications: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      if (this.isRunning) {
        await this.scheduleNextRun();
      }
    }, delayMs);
  }

  stop(): void {
    this.isRunning = false;

    if (!this.timeoutId) {
      return;
    }

    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  }
}
