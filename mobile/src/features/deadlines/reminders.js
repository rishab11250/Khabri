import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_OFFSETS_DAYS = [7, 1, 0];

export async function syncDeadlineReminders(deadlines = []) {
  if (Platform.OS === 'web') return 0;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return 0;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => item.content?.data?.kind === 'deadline-reminder')
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );

    const now = Date.now();
    let count = 0;

    for (const d of deadlines) {
      if (d.status !== 'active') continue;
      const due = new Date(d.dueAt);
      if (Number.isNaN(due.getTime())) continue;

      for (const offsetDays of REMINDER_OFFSETS_DAYS) {
        const fireAt = new Date(due);
        fireAt.setDate(fireAt.getDate() - offsetDays);
        fireAt.setHours(9, 0, 0, 0);

        if (fireAt.getTime() <= now) continue;

        const tag = offsetDays === 0 ? 'Today' : `In ${offsetDays}d`;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${d.label} (${tag})`,
            body: d.sourceName ? `${d.sourceName} · ${due.toDateString()}` : due.toDateString(),
            data: {
              kind: 'deadline-reminder',
              deadlineId: d.id,
              ...(d.changeId ? { changeId: d.changeId } : {}),
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
          },
        });
        count += 1;
      }
    }

    return count;
  } catch {
    return 0;
  }
}

export async function addDeadlineToDeviceCalendar(deadline) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission not granted');
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable =
    calendars.find((c) => c.allowsModifications && c.isPrimary) ??
    calendars.find((c) => c.allowsModifications) ??
    calendars[0];

  if (!writable) {
    throw new Error('No writable calendar found on device');
  }

  const startDate = new Date(deadline.dueAt);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  return Calendar.createEventAsync(writable.id, {
    title: `Khabri: ${deadline.label}`,
    startDate,
    endDate,
    notes: deadline.sourceUrl || deadline.sourceName || 'Tracked in Khabri',
  });
}
