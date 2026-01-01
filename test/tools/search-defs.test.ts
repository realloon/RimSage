import { describe, test, expect } from 'bun:test'
import { searchDefs } from '../../src/tools/search-defs'

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
