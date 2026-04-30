import type { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { dailyChallenges } from '../../src/db/schema'

const WORD_POOLS: Record<string, string[]> = {
  en: ['apple','bridge','cloud','dragon','eagle','flame','globe','honey',
       'island','jewel','kite','lemon','maple','noble','ocean','puzzle',
       'quartz','river','storm','torch'],
  de: ['Apfel','Brücke','Donner','Elster','Flamme','Garten','Himmel','Insel',
       'Jacke','Karte','Lampe','Mauer','Nebel','Osten','Pferd','Quelle',
       'Regen','Stern','Turm','Wald'],
  gu: ['આંબો','ઓરડો','ઘઉં','ચંદ્ર','જળ','ઝાડ','ટેકરી','ઠંડી',
       'ડુંગળી','ઢોળ','તારો','થાળ','દરિયો','ધૂળ','નદી','પર્વત',
       'ફૂલ','બગીચો','ભૂત','મેઘ'],
  hi: ['आम','बादल','चाँद','दरिया','एकता','फूल','गाना','हवा',
       'इंद्रधनुष','जंगल','कमल','लहर','मेघ','नदी','ओस','पहाड़',
       'रात','सागर','तारा','उषा'],
}

const LANGUAGES = ['en', 'de', 'gu', 'hi']

function getTomorrow(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getDifficulty(index: number): string {
  if (index < 7) return 'easy'
  if (index < 14) return 'medium'
  return 'hard'
}

export const handler: Handler = async (event) => {
  // Netlify scheduled functions set this header automatically
  const isScheduled = event.headers['x-netlify-scheduled'] === 'true'
  const authHeader = event.headers['authorization']
  const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isScheduled && !isAuthorized) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql, { schema: { dailyChallenges } })

    const tomorrow = getTomorrow()
    const inserted: string[] = []

    for (const langId of LANGUAGES) {
      const pool = WORD_POOLS[langId]
      const dayIndex = new Date(tomorrow).getUTCDate() % pool.length
      const startingWord = pickRandom(pool)
      const difficulty = getDifficulty(dayIndex)

      await db
        .insert(dailyChallenges)
        .values({
          languageId: langId,
          challengeDate: tomorrow,
          startingWord,
          difficulty,
        })
        .onConflictDoNothing()

      inserted.push(langId)
    }

    return { statusCode: 200, body: JSON.stringify({ seeded: inserted, date: tomorrow }) }
  } catch (e) {
    console.error('seed-daily-challenge error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) }
  }
}
