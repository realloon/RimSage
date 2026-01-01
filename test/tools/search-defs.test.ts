import { describe, test, expect } from 'bun:test'
import { searchDefs, searchDefsImpl } from '../../src/tools/search-defs'

describe('searchDefsImpl', () => {
  test('should return search results with data', () => {
    const result = searchDefsImpl('Gun')
    expect(result).toHaveProperty('results')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.results)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  test('should return empty results when no matches found', () => {
    const result = searchDefsImpl('NonExistentDefNameThatDoesNotExist12345')
    expect(result.results).toEqual([])
    expect(result.total).toBe(0)
  })

  test('should filter by defType', () => {
    const result = searchDefsImpl('Gun', 'ThingDef')
    expect(result.results.length).toBeGreaterThan(0)
    if (result.results.length > 0) {
      expect(result.results[0].defType).toBe('ThingDef')
    }
  })

  test('should limit results', () => {
    const result1 = searchDefsImpl('', 'ThingDef', 2)
    const result2 = searchDefsImpl('', 'ThingDef', 10)
    expect(result1.results.length).toBeLessThanOrEqual(2)
    expect(result2.results.length).toBeLessThanOrEqual(10)
  })

  test('should have total count matching or exceeding results', () => {
    const result = searchDefsImpl('Gun')
    expect(result.total).toBeGreaterThanOrEqual(result.results.length)
  })
})

describe('searchDefs', () => {
  test('should search defs by name', () => {
    const result = searchDefs('Gun')
    expect(result.content[0].text).toBeDefined()
    expect(typeof result.content[0].text).toBe('string')
  })

  test('should search defs by label', () => {
    const result = searchDefs('rifle')
    expect(result.content[0].text).toBeDefined()
    expect(typeof result.content[0].text).toBe('string')
  })

  test('should filter by defType', () => {
    const result = searchDefs('Gun', 'ThingDef')
    expect(result.content[0].text).toBeDefined()
    expect(typeof result.content[0].text).toBe('string')
  })

  test('should limit results', () => {
    const result = searchDefs('', 'ThingDef', 2)
    expect(result.content[0].text).toBeDefined()
    // Should have fewer results when limited
    expect(result.content[0].text.length).toBeGreaterThan(0)
  })

  test('should return no results message when nothing found', () => {
    const result = searchDefs('NonExistentDefNameThatDoesNotExist12345')
    expect(result.content[0].text).toBe('No results found. Try a shorter keyword.')
  })

  test('should return correct content structure', () => {
    const result = searchDefs('Gun')
    expect(result.content).toBeInstanceOf(Array)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
  })
})
