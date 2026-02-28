import { describe, test, expect } from 'bun:test'
import { searchDefs, searchDefsImpl } from '../../src/tools/search-defs'

describe('search-defs', () => {
  describe('searchDefsImpl', () => {
    test('returns matched rows with total count', () => {
      const result = searchDefsImpl('Gun_Revolver')
      expect(result.total).toBeGreaterThan(0)
      expect(result.results.some(r => r.defName === 'Gun_Revolver')).toBe(true)
    })

    test('applies defType filter to all rows', () => {
      const result = searchDefsImpl('Gun', 'ThingDef', 10)
      expect(result.results.length).toBeGreaterThan(0)
      expect(result.results.every(r => r.defType === 'ThingDef')).toBe(true)
    })

    test('respects limit while preserving total', () => {
      const result = searchDefsImpl('', 'ThingDef', 1)
      expect(result.results).toHaveLength(1)
      expect(result.total).toBeGreaterThan(1)
    })

    test('returns empty result for unknown def name', () => {
      const result = searchDefsImpl('NonExistentDefNameThatDoesNotExist12345')
      expect(result).toEqual({ results: [], total: 0 })
    })

  })

  describe('searchDefs', () => {
    test('formats rows as MCP text output', () => {
      const result = searchDefs('Gun_Revolver')
      expect(result.content[0].text).toContain('[ThingDef] Gun_Revolver')
    })

    test('includes truncation hint when limited', () => {
      const result = searchDefs('', 'ThingDef', 1)
      expect(result.content[0].text).toContain('[TRUNCATED] Showing 1/')
    })

    test('returns guidance when no results found', () => {
      const result = searchDefs('NonExistentDefNameThatDoesNotExist12345')
      expect(result.content[0].text).toBe('No results found. Try a shorter keyword.')
    })
  })
})
