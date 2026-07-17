import { Database } from 'bun:sqlite'
import { indexDbPath } from './env'

export interface DefsRow {
  defName: string
  defType: string
  label: string | null
  rawPayload: string
  mergedPayload: string
}

export const db = new Database(indexDbPath, { readonly: true })
