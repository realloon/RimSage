import { Database } from 'bun:sqlite'
import { dbPath } from './env'

export interface DefsRow {
  defName: string
  defType: string
  label: string | null
  payload: string // JSON
}

export interface CSharpIndexRow {
  typeName: string
  filePath: string
  startLine: number
  typeKind: string // 'class' | 'struct' | 'interface' | 'enum'
}

let _runtimeDb: Database | null = null

export function getDb(): Database {
  if (!_runtimeDb) {
    _runtimeDb = new Database(dbPath, { readonly: true })
    _runtimeDb.run('PRAGMA journal_mode = WAL;')
  }

  return _runtimeDb
}

export function createBuilderDb(): Database {
  const db = new Database(dbPath, { create: true })

  db.run('PRAGMA journal_mode = WAL;')
  db.run('PRAGMA synchronous = NORMAL;')

  return db
}
