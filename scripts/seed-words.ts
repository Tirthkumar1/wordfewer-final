import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { words } from '../src/db/schema'
import * as dotenv from 'dotenv'
dotenv.config()

const LANGS = ['en', 'de', 'gu', 'hi']
const BATCH = 500

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)

  for (const lang of LANGS) {
    let wordlist: string[]
    try {
      wordlist = require(`../language_packs/full/${lang}.json`)
    } catch {
      wordlist = require(`../language_packs/${lang}/wordlist.json`)
    }

    console.log(`Seeding ${lang}: ${wordlist.length} words...`)

    // Delete existing words for this language first
    await sql`DELETE FROM words WHERE language_id = ${lang}`

    // Insert in batches
    for (let i = 0; i < wordlist.length; i += BATCH) {
      const batch = wordlist.slice(i, i + BATCH).map(w => ({
        word: w.toLowerCase().trim(),
        languageId: lang,
      }))
      await db.insert(words).values(batch).onConflictDoNothing()
      process.stdout.write(`\r  ${Math.min(i + BATCH, wordlist.length)}/${wordlist.length}`)
    }
    console.log(` ✓`)
  }
  console.log('Done!')
}

main().catch(console.error)
