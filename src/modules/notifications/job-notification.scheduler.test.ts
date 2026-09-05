import { afterEach, describe, expect, it, vi } from 'vitest';

import { JobNotificationScheduler } from './job-notification.scheduler.js';
import { NotificationScheduleService } from './notification.schedule.js';

describe('JobNotificationScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should run due notifications at the next scheduled time', async () => {
    vi.useFakeTimers();

    // 09:00 Asia/Gaza = 06:00 UTC
    vi.setSystemTime(new Date('2026-09-05T05:59:59.000Z'));

    const notificationService = {
      run: vi.fn().mockResolvedValue(undefined),
      runForUser: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = new NotificationScheduleService();

    const subscriptionService = {
      getSubscribedUsers: vi.fn().mockResolvedValue([1]),
    };

    const preferenceService = {
      getPreferences: vi.fn().mockResolvedValue({
        jobTitle: 'Backend Developer',
        workType: 'remote',
        experienceLevel: 'junior',
        timezone: 'Asia/Gaza',
        notificationTimes: ['09:00', '21:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      notificationService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();

    await vi.advanceTimersByTimeAsync(1000);

    expect(notificationService.runForUser).toHaveBeenCalledWith(1);
    expect(notificationService.runForUser).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it('should not start multiple schedules', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:00:00.000Z'));

    const notificationService = {
      run: vi.fn().mockResolvedValue(undefined),
      runForUser: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = new NotificationScheduleService();

    const subscriptionService = {
      getSubscribedUsers: vi.fn().mockResolvedValue([1]),
    };

    const preferenceService = {
      getPreferences: vi.fn().mockResolvedValue({
        jobTitle: 'Backend Developer',
        workType: 'remote',
        experienceLevel: 'junior',
        timezone: 'Asia/Gaza',
        notificationTimes: ['09:00', '21:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      notificationService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();
    scheduler.start();

    // Advance to 09:00 Asia/Gaza = 06:00 UTC.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(notificationService.runForUser).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it('should stop scheduled notifications', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:00:00.000Z'));

    const notificationService = {
      run: vi.fn().mockResolvedValue(undefined),
      runForUser: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = new NotificationScheduleService();

    const subscriptionService = {
      getSubscribedUsers: vi.fn().mockResolvedValue([1]),
    };

    const preferenceService = {
      getPreferences: vi.fn().mockResolvedValue({
        jobTitle: 'Backend Developer',
        workType: 'remote',
        experienceLevel: 'junior',
        timezone: 'Asia/Gaza',
        notificationTimes: ['09:00', '21:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      notificationService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();
    scheduler.stop();

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 + 1);

    expect(notificationService.runForUser).not.toHaveBeenCalled();

    scheduler.stop();
  });

  it('should skip users without preferences', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:59:59.000Z'));

    const notificationService = {
      run: vi.fn().mockResolvedValue(undefined),
      runForUser: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = new NotificationScheduleService();

    const subscriptionService = {
      getSubscribedUsers: vi.fn().mockResolvedValue([1]),
    };

    const preferenceService = {
      getPreferences: vi.fn().mockResolvedValue(null),
    };

    const scheduler = new JobNotificationScheduler(
      notificationService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();

    await vi.advanceTimersByTimeAsync(1000);

    expect(notificationService.runForUser).not.toHaveBeenCalled();

    scheduler.stop();
  });

  it('should schedule based on the earliest notification across different timezones', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:00:00.000Z'));

    const notificationService = {
      run: vi.fn().mockResolvedValue(undefined),
      runForUser: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = new NotificationScheduleService();

    const subscriptionService = {
      getSubscribedUsers: vi.fn().mockResolvedValue([1, 2]),
    };

    const preferenceService = {
      getPreferences: vi.fn().mockImplementation(async (userId: number) => {
        if (userId === 1) {
          return {
            jobTitle: 'Backend Developer',
            workType: 'remote',
            experienceLevel: 'junior',
            timezone: 'Asia/Gaza',
            notificationTimes: ['09:00'],
          };
        }

        return {
          jobTitle: 'Frontend Developer',
          workType: 'remote',
          experienceLevel: 'junior',
          timezone: 'Europe/London',
          notificationTimes: ['09:00'],
        };
      }),
    };

    const scheduler = new JobNotificationScheduler(
      notificationService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();

    // 09:00 Europe/London = 08:00 UTC.
    // 09:00 Asia/Gaza = 06:00 UTC.
    //
    // At 05:00 UTC, Gaza is the earliest notification.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(notificationService.runForUser).toHaveBeenCalledWith(1);
    expect(notificationService.runForUser).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });
});
