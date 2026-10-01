import { describe, expect, it } from 'vitest';

import { NotificationScheduleService } from '../../src/modules/notifications/notification.schedule.js';

describe('NotificationScheduleService.getLatestDueSlot', () => {
  const service = new NotificationScheduleService();
  const times = ['09:00', '21:00'];
  // January: Asia/Gaza is UTC+2 (no DST), so local = UTC + 2h.
  const at = (iso: string): Date => new Date(iso);

  it('returns the 09:00 slot shortly after it is due', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', times, at('2026-01-15T07:30:00Z'))).toEqual({
      key: '2026-01-15-0900',
      lagMinutes: 30,
    });
  });

  it('keeps returning the 09:00 slot until 21:00 (late cron catch-up)', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', times, at('2026-01-15T11:00:00Z'))).toEqual({
      key: '2026-01-15-0900',
      lagMinutes: 240,
    });
  });

  it('returns the 21:00 slot after 21:00', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', times, at('2026-01-15T19:05:00Z'))).toEqual({
      key: '2026-01-15-2100',
      lagMinutes: 5,
    });
  });

  it('keeps yesterday 21:00 as the latest slot after midnight', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', times, at('2026-01-15T22:30:00Z'))).toEqual({
      key: '2026-01-15-2100',
      lagMinutes: 210,
    });
  });

  it('uses the previous day 21:00 before the first slot of the day', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', times, at('2026-01-15T05:00:00Z'))).toEqual({
      key: '2026-01-14-2100',
      lagMinutes: 600,
    });
  });

  it('returns null when no valid time is configured', () => {
    expect(service.getLatestDueSlot('Asia/Gaza', ['bad', ''], at('2026-01-15T05:00:00Z'))).toBeNull();
  });
});
