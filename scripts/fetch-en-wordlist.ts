/**
 * Fetches the top ~10k common English words (no swears) from Google's frequency list
 * and saves them to language_packs/en/wordlist.json and language_packs/full/en.json
 *
 * Run: npx tsx scripts/fetch-en-wordlist.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

const URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt'

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  console.log('Fetching English word list...')
  const raw = await fetch(URL)

  const words = raw
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 3 && w.length <= 16 && /^[a-z]+$/.test(w))

  console.log(`Got ${words.length} words`)

  const outPath = path.join(__dirname, '..', 'language_packs', 'en', 'wordlist.json')
  const fullPath = path.join(__dirname, '..', 'language_packs', 'full', 'en.json')

  fs.writeFileSync(outPath, JSON.stringify(words))
  fs.writeFileSync(fullPath, JSON.stringify(words))

  console.log(`Saved to language_packs/en/wordlist.json (${words.length} words)`)
  console.log('Done! Now run: npx tsx scripts/seed-words.ts to update the DB')
}

main().catch(console.error)
