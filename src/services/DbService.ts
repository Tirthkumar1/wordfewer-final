import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { daily_challenges, daily_results, scores } from '../db/schema'
import { captureError } from '../utils/errorHandler'

const DEVICE_ID_KEY = 'wordfever_device_id'

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = Crypto.randomUUID()
    await AsyncStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export interface LeaderboardEntry {
  username: string
  chain_length: number
  score: number
  played_at: string | null
}

export interface DailyChallenge {
  id: string
  language_id: string
  challenge_date: string
  starting_word: string
  difficulty: string | null
}

export interface DailyResult {
  id: string
  device_id: string
  language_id: string
  challenge_date: string
  chain_length: number | null
  score: number | null
  played_at: string | null
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export async function submitScore(
  username: string,
  languageId: string,
  chainLength: number,
  score: number,
): Promise<boolean> {
  try {
    await db.insert(scores).values({ username, language_id: languageId, chain_length: chainLength, score })
    return true
  } catch (e) {
    captureError(e, { context: 'submitScore' })
    return false
  }
}

export async function getLeaderboard(
  languageId: string,
  period: 'today' | 'week' | 'alltime',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const now = new Date()
    const cutoffs: Record<string, Date> = {
      today: new Date(now.toISOString().split('T')[0]),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    }

    const base = db
      .select({
        username: scores.username,
        chain_length: scores.chain_length,
        score: scores.score,
        played_at: sql<string>`${scores.played_at}::text`,
      })
      .from(scores)
      .where(
        period === 'alltime'
          ? eq(scores.language_id, languageId)
          : and(eq(scores.language_id, languageId), gte(scores.played_at, cutoffs[period])),
      )
      .orderBy(desc(scores.score))
      .limit(limit)

    return await base
  } catch (e) {
    captureError(e, { context: 'getLeaderboard' })
    return []
  }
}

export async function getDailyChallenge(languageId: string): Promise<DailyChallenge | null> {
  try {
    const rows = await db
      .select()
      .from(daily_challenges)
      .where(
        and(
          eq(daily_challenges.language_id, languageId),
          eq(daily_challenges.challenge_date, todayISO()),
        ),
      )
      .limit(1)
    return (rows[0] as DailyChallenge) ?? null
  } catch (e) {
    captureError(e, { context: 'getDailyChallenge' })
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
    await db
      .insert(daily_results)
      .values({
        device_id: deviceId,
        language_id: languageId,
        challenge_date: todayISO(),
        chain_length: chainLength,
        score,
      })
      .onConflictDoNothing()
    return true
  } catch (e) {
    captureError(e, { context: 'submitDailyResult' })
    return false
  }
}

export async function getTodayDailyResult(languageId: string): Promise<DailyResult | null> {
  try {
    const deviceId = await getDeviceId()
    const rows = await db
      .select()
      .from(daily_results)
      .where(
        and(
          eq(daily_results.device_id, deviceId),
          eq(daily_results.language_id, languageId),
          eq(daily_results.challenge_date, todayISO()),
        ),
      )
      .limit(1)
    return (rows[0] as DailyResult) ?? null
  } catch (e) {
    captureError(e, { context: 'getTodayDailyResult' })
    return null
  }
}
