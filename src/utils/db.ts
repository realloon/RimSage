import { Database } from 'bun:sqlite'
import { join } from 'path'

const dbPath = join(import.meta.dir, '../../dist/defs.db')

export const db = new Database(dbPath, { readonly: true })
