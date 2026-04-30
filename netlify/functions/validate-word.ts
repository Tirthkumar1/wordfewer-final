import type { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const word = event.queryStringParameters?.word?.toLowerCase().trim()
  const languageId = event.queryStringParameters?.lang

  if (!word || !languageId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing word or lang' }) }
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`
      SELECT 1 FROM words
      WHERE word = ${word} AND language_id = ${languageId}
      LIMIT 1
    `
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: result.length > 0 }),
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e) }) }
  }
}
