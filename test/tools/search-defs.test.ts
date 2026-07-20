import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { searchDefs, searchDefsImpl } from '../../src/tools/search-defs'

let db: Database

beforeAll(() => {
  db = new Database(':memory:')
  db.run(`
    CREATE TABLE defs (
      defName TEXT,
      defType TEXT,
      label TEXT
    )
  `)
  db.run(`
    INSERT INTO defs VALUES
      ('RelicInertCup', 'ThingDef', 'chalice'),
      ('TestGun', 'ThingDef', 'test gun'),
      ('TestGunJob', 'JobDef', 'test gun job')
  `)
})

afterAll(() => db.close())

describe('search-defs', () => {
  test('matches labels case-insensitively', () => {
    const text = searchDefs(db, 'CHALICE').content[0].text

    expect(text).toContain('[ThingDef] RelicInertCup')
    expect(text).toContain('(label: "chalice")')
  })

  test('filters results by Def type', () => {
    const result = searchDefsImpl(db, 'Gun', 'ThingDef', 10)

    expect(result.results).toHaveLength(1)
    expect(result.results[0].defName).toBe('TestGun')
  })

  test('reports truncated results', () => {
    const text = searchDefs(db, '', undefined, 1).content[0].text

    expect(text).toContain('[TRUNCATED] Showing 1/3 results.')
  })

  test('returns guidance when nothing matches', () => {
    const text = searchDefs(db, 'MissingDef').content[0].text

    expect(text).toBe('No results found. Try a shorter keyword.')
  })
})
