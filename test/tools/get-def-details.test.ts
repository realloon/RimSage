import { describe, test, expect } from 'bun:test'
import {
  getDefDetails,
  getDefDetailsImpl,
} from '../../src/tools/get-def-details'

describe('getDefDetailsImpl', () => {
  test('should return empty array when def not found', () => {
    const result = getDefDetailsImpl('NonExistentDefNameThatDoesNotExist12345')
    expect(result).toEqual([])
  })

  test('should return empty array when def not found with type filter', () => {
    const result = getDefDetailsImpl('SomeDef', 'NonExistentType12345')
    expect(result).toEqual([])
  })

  test('should return array of DefsRow for existing def', () => {
    const result = getDefDetailsImpl('Gun_Revolver')
    expect(Array.isArray(result)).toBe(true)

    if (result.length > 0) {
      expect(result[0]).toHaveProperty('defType')
      expect(result[0]).toHaveProperty('payload')
    }
  })
})

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

  test('should return valid MCP response format for existing def', () => {
    const result = getDefDetails('Gun_Revolver')
    expect(result).toHaveProperty('content')
    expect(result.content).toBeInstanceOf(Array)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
  })
})
