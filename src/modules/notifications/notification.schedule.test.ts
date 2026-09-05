import { describe, expect, it } from 'vitest';
import { NotificationScheduleService } from './notification.schedule.js';

describe('NotificationScheduleService', () => {
  const service = new NotificationScheduleService();

  it('should return the next notification time today', () => {
    const now = new Date('2026-09-05T15:00:00.000Z');

    const result = service.getNextNotificationTime('Asia/Gaza', ['09:00', '21:00'], now);

    expect(result).toEqual(new Date('2026-09-05T18:00:00.000Z'));
  });

  it('should return tomorrow when all notification times have passed', () => {
    const now = new Date('2026-09-05T20:00:00.000Z');

    const result = service.getNextNotificationTime('Asia/Gaza', ['09:00', '21:00'], now);

    expect(result).toEqual(new Date('2026-09-06T06:00:00.000Z'));
  });

  it('should work with a different timezone', () => {
    const now = new Date('2026-09-05T06:00:00.000Z');

    const result = service.getNextNotificationTime('Asia/Riyadh', ['09:00', '21:00'], now);

    expect(result).toEqual(new Date('2026-09-05T18:00:00.000Z'));
  });
  it('should return true when notification time is due', () => {
    const now = new Date('2026-09-05T06:00:00.000Z');

    const result = service.isNotificationDue('Asia/Gaza', ['09:00', '21:00'], now);

    expect(result).toBe(true);
  });

  it('should return false when notification time is not due', () => {
    const now = new Date('2026-09-05T07:00:00.000Z');

    const result = service.isNotificationDue('Asia/Gaza', ['09:00', '21:00'], now);

    expect(result).toBe(false);
  });
});
