import { integer, pgTable, text, date, timestamp, uuid, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull(),
  language_id: text('language_id').notNull(),
  chain_length: integer('chain_length').notNull(),
  score: integer('score').notNull(),
  played_at: timestamp('played_at', { withTimezone: true }).default(sql`now()`),
})

export const daily_challenges = pgTable(
  'daily_challenges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    language_id: text('language_id').notNull(),
    challenge_date: date('challenge_date').notNull(),
    starting_word: text('starting_word').notNull(),
    difficulty: text('difficulty'),
  },
  (t) => ({
    uniq: unique().on(t.language_id, t.challenge_date),
  }),
)

export const daily_results = pgTable(
  'daily_results',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    device_id: text('device_id').notNull(),
    language_id: text('language_id').notNull(),
    challenge_date: date('challenge_date').notNull(),
    chain_length: integer('chain_length'),
    score: integer('score'),
    played_at: timestamp('played_at', { withTimezone: true }).default(sql`now()`),
  },
  (t) => ({
    uniq: unique().on(t.device_id, t.language_id, t.challenge_date),
  }),
)
