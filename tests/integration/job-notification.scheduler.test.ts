import { afterEach, describe, expect, it, vi } from 'vitest';

import { JobNotificationScheduler } from '../../src/modules/notifications/job-notification.scheduler.js';
import { NotificationScheduleService } from '../../src/modules/notifications/notification.schedule.js';

describe('JobNotificationScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should run due notifications at the next scheduled time', async () => {
    vi.useFakeTimers();

    // 09:00 Asia/Gaza = 06:00 UTC
    vi.setSystemTime(new Date('2026-09-05T05:59:59.000Z'));

    const pipelineService = {
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
        notificationTimes: ['09:00', '18:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      pipelineService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();

    await vi.advanceTimersByTimeAsync(1000);

    expect(pipelineService.runForUser).toHaveBeenCalledWith(1);
    expect(pipelineService.runForUser).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it('should not start multiple schedules', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:00:00.000Z'));

    const pipelineService = {
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
        notificationTimes: ['09:00', '18:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      pipelineService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();
    scheduler.start();

    // Advance to 09:00 Asia/Gaza = 06:00 UTC.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(pipelineService.runForUser).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it('should stop scheduled notifications', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-05T05:00:00.000Z'));

    const pipelineService = {
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
        notificationTimes: ['09:00', '18:00'],
      }),
    };

    const scheduler = new JobNotificationScheduler(
      pipelineService,
      scheduleService,
      subscriptionService,
      preferenceService,
    );

    scheduler.start();
    scheduler.stop();

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 + 1);

    expect(pipelineService.runForUser).not.toHaveBeenCalled();

    scheduler.stop();
  });
});
