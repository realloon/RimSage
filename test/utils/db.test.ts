import { expect, test, describe, afterAll } from 'bun:test'
import { getDb, createBuilderDb, closeDb } from '../../src/utils/db'
import { Database } from 'bun:sqlite'

describe('db', () => {
  afterAll(() => {
    closeDb()
  })

  test('getDb should return a singleton Database instance', () => {
    const db1 = getDb()
    const db2 = getDb()
    expect(db1).toBeInstanceOf(Database)
    expect(db1).toBe(db2)
  })

  test('createBuilderDb should return a new Database instance', () => {
    const db = createBuilderDb()
    expect(db).toBeInstanceOf(Database)
    db.close()
  })

  test('closeDb should clear the singleton instance', () => {
    const db1 = getDb()
    closeDb()
    // We can't easily check internal state, but calling getDb again should create a new one
    // or at least not fail.
    const db2 = getDb()
    expect(db1).not.toBe(db2)
  })
})
