import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const STORAGE_KEY = 'wordfewer_notif_enabled'

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') {
    await AsyncStorage.setItem(STORAGE_KEY, 'true')
    return true
  }
  const { status } = await Notifications.requestPermissionsAsync()
  const granted = status === 'granted'
  await AsyncStorage.setItem(STORAGE_KEY, granted ? 'true' : 'false')
  return granted
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}

async function cancelByIdentifier(identifier: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const n of scheduled) {
    if (n.identifier.startsWith(identifier)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier)
    }
  }
}

// ─── Daily Challenge Reminder ─────────────────────────────────────────────────
// Fires every day at 10:00 AM local time

export async function scheduleDailyChallenge(): Promise<void> {
  const enabled = await isNotificationsEnabled()
  if (!enabled) return

  await cancelByIdentifier('daily_challenge')

  const messages = [
    { title: "Today's Challenge is Live 🔥", body: "A new word chain awaits. Can you top the leaderboard?" },
    { title: "Daily Challenge Ready 🧠", body: "A fresh challenge dropped. How long can you chain?" },
    { title: "New Day, New Chain ⛓️", body: "Today's daily challenge is live. Play now!" },
  ]
  const pick = messages[new Date().getDay() % messages.length]

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_challenge_reminder',
    content: {
      title: pick.title,
      body: pick.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  })
}

export async function cancelDailyChallenge(): Promise<void> {
  await cancelByIdentifier('daily_challenge')
}

// ─── Streak Reminder ──────────────────────────────────────────────────────────
// Fires once at 8:00 PM if the user hasn't played today

export async function scheduleStreakReminder(): Promise<void> {
  const enabled = await isNotificationsEnabled()
  if (!enabled) return

  await cancelByIdentifier('streak_reminder')

  const streak = parseInt(
    (await AsyncStorage.getItem('wordfever_streak')) ?? '0',
    10,
  )

  const title = streak >= 7
    ? `${streak}-day streak on the line 🔥`
    : streak > 0
    ? `Keep your ${streak}-day streak alive`
    : "Don't forget to play today!"

  const body = streak >= 3
    ? "You're on a roll. One game keeps the streak going."
    : "Play a quick game and start your streak today."

  await Notifications.scheduleNotificationAsync({
    identifier: 'streak_reminder_today',
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  })
}

export async function cancelStreakReminder(): Promise<void> {
  await cancelByIdentifier('streak_reminder')
}

// ─── Schedule all active notifications ───────────────────────────────────────

export async function scheduleAllNotifications(): Promise<void> {
  await Promise.all([scheduleDailyChallenge(), scheduleStreakReminder()])
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

export async function registerForPushNotifications(): Promise<string | null> {
  const granted = await requestNotificationPermission()
  if (!granted) return null
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'WordFever',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }
  await scheduleAllNotifications()
  const token = await Notifications.getExpoPushTokenAsync().catch(() => null)
  return token?.data ?? null
}
