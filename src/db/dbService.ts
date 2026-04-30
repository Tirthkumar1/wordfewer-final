import { db } from './client'
import { scores, dailyChallenges, dailyResults } from './schema'
import { eq, and, desc, gte } from 'drizzle-orm'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { StorageKeys } from '../config/storageKeys'

export async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(StorageKeys.DEVICE_ID)
  if (stored) return stored
  const id = Crypto.randomUUID()
  await AsyncStorage.setItem(StorageKeys.DEVICE_ID, id)
  return id
}

export async function submitScore(
  userId: string | null,
  username: string,
  languageId: string,
  timerMode: number,
  chainLength: number,
  score: number,
): Promise<boolean> {
  try {
    await db.insert(scores).values({ userId, username, languageId, timerMode, chainLength, score })
    return true
  } catch (e) {
    console.error('submitScore failed:', e)
    return false
  }
}

export type LeaderboardEntry = {
  username: string
  languageId: string
  timerMode: number | null
  chainLength: number
  score: number
  playedAt: Date | null
}

export async function getLeaderboard(
  languageId: string,
  period: 'today' | 'week' | 'alltime',
  timerMode: number,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const now = new Date()
    const timerFilter = eq(scores.timerMode, timerMode)
    const langFilter = eq(scores.languageId, languageId)

    if (period === 'today') {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return await db.select().from(scores)
        .where(and(langFilter, timerFilter, gte(scores.playedAt, start)))
        .orderBy(desc(scores.score))
        .limit(limit) as LeaderboardEntry[]
    }

    if (period === 'week') {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return await db.select().from(scores)
        .where(and(langFilter, timerFilter, gte(scores.playedAt, start)))
        .orderBy(desc(scores.score))
        .limit(limit) as LeaderboardEntry[]
    }

    return await db.select().from(scores)
      .where(and(langFilter, timerFilter))
      .orderBy(desc(scores.score))
      .limit(limit) as LeaderboardEntry[]
  } catch (e) {
    console.error('getLeaderboard failed:', e)
    return []
  }
}

export async function getDailyChallenge(
  languageId: string,
): Promise<typeof dailyChallenges.$inferSelect | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const result = await db.select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.languageId, languageId),
        eq(dailyChallenges.challengeDate, today),
      ))
      .limit(1)
    return result[0] ?? null
  } catch (e) {
    console.error('getDailyChallenge failed:', e)
    return null
  }
}

export async function submitDailyResult(
  languageId: string,
  chainLength: number,
  score: number,
): Promise<boolean> {
  try {
    const deviceId = await getDeviceId()
    const today = new Date().toISOString().split('T')[0]
    await db.insert(dailyResults)
      .values({ deviceId, languageId, challengeDate: today, chainLength, score })
      .onConflictDoNothing()
    return true
  } catch (e) {
    console.error('submitDailyResult failed:', e)
    return false
  }
}

export async function getTodayDailyResult(
  languageId: string,
): Promise<typeof dailyResults.$inferSelect | null> {
  try {
    const deviceId = await getDeviceId()
    const today = new Date().toISOString().split('T')[0]
    const result = await db.select()
      .from(dailyResults)
      .where(and(
        eq(dailyResults.deviceId, deviceId),
        eq(dailyResults.languageId, languageId),
        eq(dailyResults.challengeDate, today),
      ))
      .limit(1)
    return result[0] ?? null
  } catch (e) {
    console.error('getTodayDailyResult failed:', e)
    return null
  }
}
