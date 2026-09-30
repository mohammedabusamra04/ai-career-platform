import { DateTime } from 'luxon';

export class NotificationScheduleService {
  getNextNotificationTime(
    timezone: string,
    notificationTimes: string[],
    now: Date = new Date(),
  ): Date {
    const validZone = this.getValidTimezone(timezone);
    const validTimes = notificationTimes.length > 0 ? notificationTimes : ['09:00', '21:00'];
    const current = DateTime.fromJSDate(now).setZone(validZone);

    const candidates = validTimes
      .map((time) => {
        const [hour, minute] = time.split(':').map(Number);

        let notification = current.startOf('day').set({
          hour: Number.isNaN(hour) ? 9 : hour,
          minute: Number.isNaN(minute) ? 0 : minute,
          second: 0,
          millisecond: 0,
        });

        if (notification <= current) {
          notification = notification.plus({ days: 1 });
        }

        return notification;
      })
      .sort((a, b) => a.toMillis() - b.toMillis());

    return candidates[0].toJSDate();
  }

  isNotificationDue(
    timezone: string,
    notificationTimes: string[],
    now: Date = new Date(),
  ): boolean {
    const validZone = this.getValidTimezone(timezone);
    const validTimes = notificationTimes.length > 0 ? notificationTimes : ['09:00', '21:00'];
    const current = DateTime.fromJSDate(now).setZone(validZone);
    const currentTime = current.toFormat('HH:mm');

    return validTimes.includes(currentTime);
  }

  /**
   * True when `now` (in the given timezone) falls inside the window that
   * starts at one of the notification times. Used to make UTC-only triggers
   * (GitHub Actions cron) DST-safe and tolerant to start delays.
   */
  isWithinRunWindow(
    timezone: string,
    notificationTimes: string[],
    now: Date = new Date(),
    windowMinutes = 59,
  ): boolean {
    const current = DateTime.fromJSDate(now).setZone(this.getValidTimezone(timezone));

    return notificationTimes.some((time) => {
      const [hour, minute] = time.split(':').map(Number);

      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return false;
      }

      const slot = current.startOf('day').set({ hour, minute });
      const diffMinutes = current.diff(slot, 'minutes').minutes;

      return diffMinutes >= 0 && diffMinutes <= windowMinutes;
    });
  }

  private getValidTimezone(timezone: string): string {
    if (!timezone || typeof timezone !== 'string') {
      return 'Asia/Gaza';
    }

    try {
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid ? timezone : 'Asia/Gaza';
    } catch {
      return 'Asia/Gaza';
    }
  }
}
