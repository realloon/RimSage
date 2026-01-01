import { describe, test, expect } from 'bun:test'
import { readCsharpType } from '../../src/tools/read-csharp-type'

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
})
