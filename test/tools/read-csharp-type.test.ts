import { describe, test, expect } from 'bun:test'
import { readCsharpType, readCsharpTypeImpl } from '../../src/tools/read-csharp-type'

describe('readCsharpTypeImpl', () => {
  test('should return empty array when type not found', async () => {
    const result = await readCsharpTypeImpl('NonExistentTypeNameThatDoesNotExist12345')
    expect(result).toEqual([])
  })

  test('should return array of type definitions', async () => {
    const result = await readCsharpTypeImpl('ThingDef')
    expect(Array.isArray(result)).toBe(true)

    if (result.length > 0) {
      expect(result[0]).toHaveProperty('filePath')
      expect(result[0]).toHaveProperty('startLine')
      expect(result[0]).toHaveProperty('lineCount')
      expect(result[0]).toHaveProperty('code')
      expect(result[0]).toHaveProperty('isTruncated')
      expect(result[0]).toHaveProperty('fileExists')
    }
  })
})

describe('readCsharpType', () => {
  test('should return error when type not found', async () => {
    const result = await readCsharpType('NonExistentTypeNameThatDoesNotExist12345')
    expect(result.content[0].text).toContain('not found in index')
  })

  test('should return correct content structure for non-existent type', async () => {
    const result = await readCsharpType('NonExistent.Type')
    expect(result.content).toBeInstanceOf(Array)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
  })

  test('should return valid MCP response format for existing type', async () => {
    const result = await readCsharpType('ThingDef')
    expect(result).toHaveProperty('content')
    expect(result.content).toBeInstanceOf(Array)
    expect(result.content[0]).toHaveProperty('type', 'text')
    expect(result.content[0]).toHaveProperty('text')
  })
})
