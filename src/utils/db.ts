import { Database } from 'bun:sqlite'
import { dbPath } from './env'

export interface DefsTable {
  defName: string
  defType: string
  label: string | null
  payload: string // JSON
}

export const db = new Database(dbPath, { readonly: true })
