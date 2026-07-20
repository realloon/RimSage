import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { getDefDetails } from '../../src/tools/get-def-details'

let db: Database

beforeAll(() => {
  db = new Database(':memory:')
  db.run(`
    CREATE TABLE defs (
      defName TEXT,
      defType TEXT,
      label TEXT,
      rawPayload JSON,
      mergedPayload JSON,
      PRIMARY KEY (defName, defType)
    )
  `)

  const insert = db.prepare(`
    INSERT INTO defs (defName, defType, label, rawPayload, mergedPayload)
    VALUES ($defName, $defType, NULL, $rawPayload, $mergedPayload)
  `)

  insert.run({
    $defName: 'TestGun',
    $defType: 'ThingDef',
    $rawPayload: JSON.stringify({
      defType: 'ThingDef',
      '@_ParentName': 'BaseGun',
      defName: 'TestGun',
    }),
    $mergedPayload: JSON.stringify({
      defType: 'ThingDef',
      defName: 'TestGun',
      alwaysHaulable: true,
    }),
  })

  for (const defType of ['BodyDef', 'ThingDef']) {
    const payload = JSON.stringify({ defType, defName: 'SharedName' })
    insert.run({
      $defName: 'SharedName',
      $defType: defType,
      $rawPayload: payload,
      $mergedPayload: payload,
    })
  }
})

afterAll(() => db.close())

describe('get-def-details', () => {
  test('returns an MCP error when the Def is missing', () => {
    const result = getDefDetails(db, 'MissingDef')

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  test('renders raw and merged inheritance modes', () => {
    const raw = getDefDetails(db, 'TestGun', 'ThingDef', 'raw').content[0].text
    const merged = getDefDetails(db, 'TestGun', 'ThingDef').content[0].text

    expect(raw).toContain('ParentName="BaseGun"')
    expect(raw).not.toContain('<alwaysHaulable>true</alwaysHaulable>')
    expect(merged).toContain('<alwaysHaulable>true</alwaysHaulable>')
  })

  test('renders every Def when a name is shared across types', () => {
    const text = getDefDetails(db, 'SharedName').content[0].text

    expect(text).toContain('<BodyDef>')
    expect(text).toContain('<ThingDef>')
  })
})
