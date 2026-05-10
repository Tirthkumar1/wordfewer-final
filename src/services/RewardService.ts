import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Storage keys ─────────────────────────────────────────────────────────────

const K = {
  CONTINUE_TOKENS:      'wordfewer_continue_tokens',
  FREEZE_TOKENS:        'wordfewer_freeze_tokens',
  BONUS_START_SECS:     'wordfewer_bonus_start_secs',
  SCORE_MULTIPLIER:     'wordfewer_score_multiplier',
  FLAME_COLOR:          'wordfewer_flame_color',
  TITLE:                'wordfewer_title',
  CLAIMED_MILESTONES:   'wordfewer_claimed_milestones',
  DAILY_GOAL_DATE:      'wordfewer_daily_goal_date',
  DAILY_GOAL_COMPLETED: 'wordfewer_daily_goal_completed',
  STREAK:               'wordfewer_streak',
  LAST_PLAYED_DATE:     'wordfewer_last_played_date',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlameColor = 'orange' | 'blue' | 'purple' | 'gold'

export interface DailyGoal {
  type: 'chain' | 'score'
  target: number
  label: string
}

export interface ScoreMultiplier {
  multiplier: number
  expiresAt: number  // timestamp ms
}

export interface RewardState {
  continueTokens: number
  freezeTokens: number
  bonusStartSecs: number
  scoreMultiplier: ScoreMultiplier | null
  flameColor: FlameColor
  title: string | null
  streak: number
  claimedMilestones: string[]
}

// ─── Streak milestones ────────────────────────────────────────────────────────

export const MILESTONES: Array<{
  id: string
  days: number
  label: string
  description: string
  reward: string
}> = [
  { id: 'streak_3',  days: 3,  label: '3-Day Warrior',  description: '3 day streak',  reward: '1 free continue token' },
  { id: 'streak_7',  days: 7,  label: '7-Day Chainer',  description: '7 day streak',  reward: 'Flame turns blue + profile badge' },
  { id: 'streak_14', days: 14, label: '14-Day Wordsmith',description: '14 day streak', reward: '+5s bonus start time (permanent)' },
  { id: 'streak_30', days: 30, label: '30-Day Legend',   description: '30 day streak', reward: 'Gold flame + "Legend" title + 2× score for 7 days' },
]

// ─── Daily Goal generation ────────────────────────────────────────────────────

export function getDailyGoal(): DailyGoal {
  const today = new Date().toISOString().split('T')[0]
  const hash = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const isChain = hash % 2 === 0
  if (isChain) {
    const targets = [5, 8, 10, 12, 15, 20]
    const target = targets[hash % targets.length]
    return { type: 'chain', target, label: `Chain ${target} words in one game` }
  } else {
    const targets = [100, 200, 300, 500, 750, 1000]
    const target = targets[hash % targets.length]
    return { type: 'score', target, label: `Score ${target} pts in one game` }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getInt(key: string, fallback = 0): Promise<number> {
  const v = await AsyncStorage.getItem(key)
  return v !== null ? parseInt(v, 10) : fallback
}

async function setInt(key: string, val: number) {
  await AsyncStorage.setItem(key, String(val))
}

// ─── Read full reward state ───────────────────────────────────────────────────

export async function getRewardState(): Promise<RewardState> {
  const [ct, ft, bs, smRaw, flame, title, streak, milestonesRaw] = await Promise.all([
    AsyncStorage.getItem(K.CONTINUE_TOKENS),
    AsyncStorage.getItem(K.FREEZE_TOKENS),
    AsyncStorage.getItem(K.BONUS_START_SECS),
    AsyncStorage.getItem(K.SCORE_MULTIPLIER),
    AsyncStorage.getItem(K.FLAME_COLOR),
    AsyncStorage.getItem(K.TITLE),
    AsyncStorage.getItem(K.STREAK),
    AsyncStorage.getItem(K.CLAIMED_MILESTONES),
  ])

  let scoreMultiplier: ScoreMultiplier | null = null
  if (smRaw) {
    const parsed: ScoreMultiplier = JSON.parse(smRaw)
    if (parsed.expiresAt > Date.now()) scoreMultiplier = parsed
    else await AsyncStorage.removeItem(K.SCORE_MULTIPLIER)
  }

  return {
    continueTokens:   Math.min(parseInt(ct ?? '0', 10), 3),
    freezeTokens:     parseInt(ft ?? '0', 10),
    bonusStartSecs:   Math.min(parseInt(bs ?? '0', 10), 10),
    scoreMultiplier,
    flameColor:       (flame as FlameColor) ?? 'orange',
    title:            title ?? null,
    streak:           parseInt(streak ?? '0', 10),
    claimedMilestones: milestonesRaw ? JSON.parse(milestonesRaw) : [],
  }
}

// ─── Token operations ─────────────────────────────────────────────────────────

export async function useContinueToken(): Promise<boolean> {
  const n = await getInt(K.CONTINUE_TOKENS)
  if (n <= 0) return false
  await setInt(K.CONTINUE_TOKENS, n - 1)
  return true
}

export async function useFreezeToken(): Promise<boolean> {
  const n = await getInt(K.FREEZE_TOKENS)
  if (n <= 0) return false
  await setInt(K.FREEZE_TOKENS, n - 1)
  return true
}

export async function addContinueToken(count = 1) {
  const n = await getInt(K.CONTINUE_TOKENS)
  await setInt(K.CONTINUE_TOKENS, Math.min(n + count, 3))
}

export async function addFreezeToken(count = 1) {
  const n = await getInt(K.FREEZE_TOKENS)
  await setInt(K.FREEZE_TOKENS, n + count)
}

// ─── Daily goal tracking ──────────────────────────────────────────────────────

export async function isDailyGoalCompleted(): Promise<boolean> {
  const [date, completed] = await Promise.all([
    AsyncStorage.getItem(K.DAILY_GOAL_DATE),
    AsyncStorage.getItem(K.DAILY_GOAL_COMPLETED),
  ])
  const today = new Date().toISOString().split('T')[0]
  return date === today && completed === 'true'
}

export async function checkAndCompleteDailyGoal(
  chainLength: number,
  score: number,
): Promise<{ justCompleted: boolean }> {
  const already = await isDailyGoalCompleted()
  if (already) return { justCompleted: false }

  const goal = getDailyGoal()
  const met = goal.type === 'chain' ? chainLength >= goal.target : score >= goal.target
  if (!met) return { justCompleted: false }

  const today = new Date().toISOString().split('T')[0]
  await AsyncStorage.setItem(K.DAILY_GOAL_DATE, today)
  await AsyncStorage.setItem(K.DAILY_GOAL_COMPLETED, 'true')

  // Award 1 continue token
  await addContinueToken(1)

  // Update streak
  const lastPlayed = await AsyncStorage.getItem(K.LAST_PLAYED_DATE)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const streak = await getInt(K.STREAK)
  const newStreak = lastPlayed === yesterday ? streak + 1 : 1
  await setInt(K.STREAK, newStreak)
  await AsyncStorage.setItem(K.LAST_PLAYED_DATE, today)

  // Check milestones
  await checkMilestones(newStreak)

  return { justCompleted: true }
}

// ─── Milestone rewards ────────────────────────────────────────────────────────

async function checkMilestones(streak: number) {
  const raw = await AsyncStorage.getItem(K.CLAIMED_MILESTONES)
  const claimed: string[] = raw ? JSON.parse(raw) : []

  for (const m of MILESTONES) {
    if (streak >= m.days && !claimed.includes(m.id)) {
      claimed.push(m.id)
      await grantMilestoneReward(m.id, streak)
    }
  }

  await AsyncStorage.setItem(K.CLAIMED_MILESTONES, JSON.stringify(claimed))
}

async function grantMilestoneReward(milestoneId: string, streak: number) {
  switch (milestoneId) {
    case 'streak_3':
      await addContinueToken(1)
      break

    case 'streak_7':
      await AsyncStorage.setItem(K.FLAME_COLOR, 'blue')
      break

    case 'streak_14': {
      const current = await getInt(K.BONUS_START_SECS)
      await setInt(K.BONUS_START_SECS, Math.min(current + 5, 10))
      await AsyncStorage.setItem(K.FLAME_COLOR, 'purple')
      break
    }

    case 'streak_30': {
      await AsyncStorage.setItem(K.FLAME_COLOR, 'gold')
      await AsyncStorage.setItem(K.TITLE, 'Legend')
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
      await AsyncStorage.setItem(K.SCORE_MULTIPLIER, JSON.stringify({ multiplier: 2, expiresAt }))
      break
    }
  }
}

// ─── Getters for game start ───────────────────────────────────────────────────

export async function getBonusStartSecs(): Promise<number> {
  return getInt(K.BONUS_START_SECS)
}

export async function getActiveScoreMultiplier(): Promise<number> {
  const raw = await AsyncStorage.getItem(K.SCORE_MULTIPLIER)
  if (!raw) return 1
  const sm: ScoreMultiplier = JSON.parse(raw)
  if (sm.expiresAt <= Date.now()) {
    await AsyncStorage.removeItem(K.SCORE_MULTIPLIER)
    return 1
  }
  return sm.multiplier
}
