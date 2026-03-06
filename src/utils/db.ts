import { Database } from 'bun:sqlite'
import { indexDbPath } from './env'

export interface CSharpIndexRow {
  typeName: string
  filePath: string
  startLine: number
  typeKind: string // 'class' | 'struct' | 'interface' | 'enum'
}

export interface DefsRow {
  defName: string
  defType: string
  label: string | null
  rawPayload: string
  mergedPayload: string
}

let _runtimeDb: Database | null = null

export function getDb(): Database {
  if (!_runtimeDb) {
    _runtimeDb = new Database(indexDbPath, { readonly: true })
  }

  return _runtimeDb
}

export function closeDb(): void {
  if (_runtimeDb) {
    _runtimeDb.close()
    _runtimeDb = null
  }
}

export function createBuilderDb(): Database {
  const db = new Database(indexDbPath, { create: true })

  db.run('PRAGMA journal_mode = WAL;')
  db.run('PRAGMA synchronous = NORMAL;')

  return db
}
