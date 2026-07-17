import { describe, expect, test } from 'bun:test'
import { searchDefs, searchDefsImpl } from '../../src/tools/search-defs'

describe('search-defs', () => {
  test('matches labels case-insensitively', () => {
    const text = searchDefs('CHALICE').content[0].text

    expect(text).toContain('[ThingDef] RelicInertCup')
    expect(text).toContain('(label: "chalice")')
  })

  test('filters results by Def type', () => {
    const result = searchDefsImpl('Gun', 'ThingDef', 10)

    expect(result.results.length).toBeGreaterThan(0)
    expect(result.results.every(row => row.defType === 'ThingDef')).toBe(true)
  })

  test('reports truncated results', () => {
    const text = searchDefs('', 'ThingDef', 1).content[0].text

    expect(text).toContain('[TRUNCATED] Showing 1/')
  })

  test('returns guidance when nothing matches', () => {
    const text = searchDefs('NonExistentDefNameThatDoesNotExist12345')
      .content[0].text

    expect(text).toBe('No results found. Try a shorter keyword.')
  })
})
