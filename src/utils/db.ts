import { Database } from 'bun:sqlite'
import { indexDbPath } from './env'

export const db = new Database(indexDbPath, { readonly: true })
