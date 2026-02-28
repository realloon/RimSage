import { describe, test, expect } from 'bun:test'
import { readCsharpType, readCsharpTypeImpl } from '../../src/tools/read-csharp-type'

describe('read-csharp-type', () => {
  describe('readCsharpTypeImpl', () => {
    test('returns empty array when type is missing', async () => {
      const result = await readCsharpTypeImpl(
        'NonExistentTypeNameThatDoesNotExist12345'
      )
      expect(result).toEqual([])
    })

    test('returns indexed source slices for existing type', async () => {
      const result = await readCsharpTypeImpl('ThingDef')
      expect(result.length).toBeGreaterThan(0)

      const first = result[0]
      expect(first.fileExists).toBe(true)
      expect(first.filePath).toContain('.cs')
      expect(first.lineCount).toBeGreaterThan(0)
      expect(first.code).toContain('ThingDef')
    })

    test('marks large type definitions as truncated candidates', async () => {
      const result = await readCsharpTypeImpl('ThingDef')
      expect(result[0].isTruncated).toBe(true)
      expect(result[0].lineCount).toBeGreaterThan(400)
    })
  })

  describe('readCsharpType', () => {
    test('returns helpful message when type is not found', async () => {
      const result = await readCsharpType('NonExistentTypeNameThatDoesNotExist12345')
      expect(result.content[0].text).toContain('not found in index')
    })

    test('renders file header for existing type', async () => {
      const result = await readCsharpType('ThingDef')
      expect(result.content[0].text).toContain('// File: Verse/ThingDef.cs')
    })

    test('adds summary note when large output is auto-summarized', async () => {
      const result = await readCsharpType('ThingDef')
      const text = result.content[0].text
      expect(text).toContain('[AUTO-SUMMARY:')
      expect(text).toContain('[SYSTEM NOTE]')
    })
  })
})
