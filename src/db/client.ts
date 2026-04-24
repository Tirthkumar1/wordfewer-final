import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { Env } from '../config/env'

const sql = neon(Env.DATABASE_URL)
export const db = drizzle(sql, { schema })
