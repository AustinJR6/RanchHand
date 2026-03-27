// Notifications service for RanchHand
// Handles scheduling and canceling local push notifications for tasks and reminders.
// Uses expo-notifications — no backend or external service required.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_MAP_KEY = 'ranchhand_notification_map';

// How the notification appears when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Maps taskId → notificationId so we can cancel on task completion/delete
type NotificationMap = Record<string, string>;

async function loadNotificationMap(): Promise<NotificationMap> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveNotificationMap(map: NotificationMap): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
}

class NotificationsService {
  /**
   * Request notification permissions from the OS.
   * Call this once at app startup (e.g. in App.tsx).
   * Returns true if permission was granted.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ranchhand-reminders', {
        name: 'RanchHand Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Schedule a reminder for a task.
   * Automatically cancels any previous notification for the same taskId.
   *
   * @param taskId       Firestore task document ID
   * @param title        Notification title (usually the task title)
   * @param body         Notification body text
   * @param triggerDate  When to fire the notification
   */
  async scheduleTaskReminder(
    taskId: string,
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<void> {
    // Don't schedule reminders in the past
    if (triggerDate <= new Date()) return;

    // Cancel existing notification for this task if any
    await this.cancelTaskReminder(taskId);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 ${title}`,
        body,
        data: { taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    // Persist the mapping so we can cancel later
    const map = await loadNotificationMap();
    map[taskId] = notificationId;
    await saveNotificationMap(map);
  }

  /**
   * Schedule a daily repeating reminder (e.g. morning feeding).
   *
   * @param taskId   Firestore task ID (used as key)
   * @param title    Notification title
   * @param body     Notification body
   * @param hour     Hour of day (0-23) in local time
   * @param minute   Minute of hour (0-59)
   */
  async scheduleDailyReminder(
    taskId: string,
    title: string,
    body: string,
    hour: number,
    minute: number
  ): Promise<void> {
    await this.cancelTaskReminder(taskId);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 ${title}`,
        body,
        data: { taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    const map = await loadNotificationMap();
    map[taskId] = notificationId;
    await saveNotificationMap(map);
  }

  /**
   * Schedule a weekly repeating reminder.
   *
   * @param weekday  0=Sunday … 6=Saturday
   */
  async scheduleWeeklyReminder(
    taskId: string,
    title: string,
    body: string,
    weekday: number,
    hour: number,
    minute: number
  ): Promise<void> {
    await this.cancelTaskReminder(taskId);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 ${title}`,
        body,
        data: { taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday + 1, // expo-notifications uses 1=Sunday … 7=Saturday
        hour,
        minute,
      },
    });

    const map = await loadNotificationMap();
    map[taskId] = notificationId;
    await saveNotificationMap(map);
  }

  /**
   * Cancel the scheduled notification for a specific task.
   * Call this when a task is completed or deleted.
   */
  async cancelTaskReminder(taskId: string): Promise<void> {
    const map = await loadNotificationMap();
    const notificationId = map[taskId];
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
      delete map[taskId];
      await saveNotificationMap(map);
    }
  }

  /**
   * Cancel ALL scheduled notifications (e.g. on sign out or data reset).
   */
  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_MAP_KEY);
  }

  /**
   * Convenience: schedule a reminder N minutes before a due date.
   * Used by tasks that have a specific due time.
   */
  async scheduleReminderBeforeDue(
    taskId: string,
    title: string,
    dueDate: Date,
    minutesBefore = 30
  ): Promise<void> {
    const triggerDate = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);
    const body = minutesBefore === 0
      ? 'This task is due now!'
      : `Due in ${minutesBefore} minutes`;
    await this.scheduleTaskReminder(taskId, title, body, triggerDate);
  }

  /**
   * Auto-schedule a reminder for a task based on its frequency.
   * Call this when creating AI-generated tasks from a care plan.
   *
   * daily    → reminder at 7:00 AM every day
   * weekly   → reminder Monday 7:00 AM
   * biweekly → one-time reminder 30 min before due date
   * monthly  → one-time reminder 1 day before due date
   * once     → 30 min before due date
   */
  async autoScheduleForTask(task: {
    id: string;
    title: string;
    category: string;
    frequency?: string;
    dueDate?: Date;
  }): Promise<void> {
    const { id, title, category, frequency, dueDate } = task;
    const body = `Time to: ${title}`;

    switch (frequency) {
      case 'daily':
        await this.scheduleDailyReminder(id, title, body, 7, 0);
        break;
      case 'weekly':
        await this.scheduleWeeklyReminder(id, title, body, 1, 7, 0); // Monday
        break;
      case 'biweekly':
      case 'monthly':
      case 'once':
      default:
        if (dueDate) {
          await this.scheduleReminderBeforeDue(id, title, dueDate, 30);
        }
        break;
    }
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
