import { DateTime } from 'luxon';

export class NotificationScheduleService {
  getNextNotificationTime(
    timezone: string,
    notificationTimes: string[],
    now: Date = new Date(),
  ): Date {
    const current = DateTime.fromJSDate(now).setZone(timezone);

    const candidates = notificationTimes
      .map((time) => {
        const [hour, minute] = time.split(':').map(Number);

        let notification = current.startOf('day').set({
          hour,
          minute,
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
    const current = DateTime.fromJSDate(now).setZone(timezone);

    const currentTime = current.toFormat('HH:mm');

    return notificationTimes.includes(currentTime);
  }
}
