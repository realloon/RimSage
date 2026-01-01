import { describe, test, expect } from 'bun:test'
import { getDefDetails } from '../../src/tools/get-def-details'

describe('getDefDetails', () => {
  test('should return error when def not found', () => {
    const result = getDefDetails('NonExistentDefNameThatDoesNotExist12345')
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  test('should return error when def not found with type filter', () => {
    const result = getDefDetails('SomeDef', 'NonExistentType12345')
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  test('should return correct content structure for non-existent def', () => {
    const result = getDefDetails('NonExistent')
    expect(result.content).toBeInstanceOf(Array)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
    expect(result.isError).toBe(true)
  })
})
