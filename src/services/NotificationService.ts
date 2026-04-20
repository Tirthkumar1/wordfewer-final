import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { captureError } from '../utils/errorHandler'

const STREAK_REMINDER_ID = 'wordfever_streak_reminder'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C47FF',
      })
    }

    const token = await Notifications.getExpoPushTokenAsync()
    return token.data
  } catch (e) {
    captureError(e, { context: 'registerForPushNotifications' })
    return null
  }
}

export async function scheduleStreakReminder(): Promise<void> {
  try {
    await cancelStreakReminder()
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_REMINDER_ID,
      content: {
        title: 'Keep your streak alive! 🔥',
        body: "You haven't played today. Jump in for a quick round!",
        sound: true,
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    })
  } catch (e) {
    captureError(e, { context: 'scheduleStreakReminder' })
  }
}

export async function cancelStreakReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID)
  } catch {
    // already cancelled or never scheduled
  }
}
