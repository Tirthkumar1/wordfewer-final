import { pgTable, uuid, text, integer, timestamp, date, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull(),
  languageId: text('language_id').notNull(),
  chainLength: integer('chain_length').notNull(),
  score: integer('score').notNull(),
  playedAt: timestamp('played_at').defaultNow(),
})

export const dailyChallenges = pgTable('daily_challenges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  languageId: text('language_id').notNull(),
  challengeDate: date('challenge_date').notNull(),
  startingWord: text('starting_word').notNull(),
  difficulty: text('difficulty').notNull().default('medium'),
}, (t) => ({
  uniq: unique().on(t.languageId, t.challengeDate),
}))

export const dailyResults = pgTable('daily_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text('device_id').notNull(),
  languageId: text('language_id').notNull(),
  challengeDate: date('challenge_date').notNull(),
  chainLength: integer('chain_length'),
  score: integer('score'),
  playedAt: timestamp('played_at').defaultNow(),
}, (t) => ({
  uniq: unique().on(t.deviceId, t.languageId, t.challengeDate),
}))
