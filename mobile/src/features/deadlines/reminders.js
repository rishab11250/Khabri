/**
 * Schedules local deadline reminder notifications (7d, 1d, 0d before at 09:00) and
 * writes events into the device's default calendar when explicitly triggered by the user.
 */
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_OFFSETS_DAYS = [7, 1, 0];

async function scheduleSingleDeadline(deadline, now) {
  if (deadline.status !== 'active') return 0;
  const due = new Date(deadline.dueAt);
  if (Number.isNaN(due.getTime())) return 0;

  let scheduled = 0;
  for (const offsetDays of REMINDER_OFFSETS_DAYS) {
    const fireAt = new Date(due);
    fireAt.setDate(fireAt.getDate() - offsetDays);
    fireAt.setHours(9, 0, 0, 0);

    if (fireAt.getTime() <= now) continue;

    const tag = offsetDays === 0 ? 'Today' : `In ${offsetDays}d`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${deadline.label} (${tag})`,
        body: deadline.sourceName
          ? `${deadline.sourceName} · ${due.toDateString()}`
          : due.toDateString(),
        data: {
          kind: 'deadline-reminder',
          deadlineId: deadline.id,
          ...(deadline.changeId ? { changeId: deadline.changeId } : {}),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
    scheduled += 1;
  }
  return scheduled;
}

/**
 * Replaces previously scheduled `deadline-reminder` notifications for all active future deadlines.
 *
 * @param {Array<object>} [deadlines] - User deadline records.
 * @returns {Promise<number>} Number of reminder notifications scheduled.
 */
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
      count += await scheduleSingleDeadline(d, now);
    }

    return count;
  } catch {
    return 0;
  }
}

/**
 * Requests OS calendar permissions and inserts a 1-hour 09:00 event on the user's primary calendar.
 *
 * @param {object} deadline - Deadline record (`label`, `dueAt`, `sourceUrl`, `sourceName`).
 * @returns {Promise<string>} Native calendar event ID string.
 * @throws {Error} When calendar permission is denied or no writable calendar exists.
 */
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
