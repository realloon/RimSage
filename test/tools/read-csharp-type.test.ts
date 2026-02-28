import { describe, test, expect, mock } from 'bun:test'
import { readCsharpType, readCsharpTypeImpl } from '../../src/tools/read-csharp-type'
import * as realDbModule from '../../src/utils/db'

const originalDbModule = { ...realDbModule }

describe.serial('read-csharp-type', () => {
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

    test('returns explicit missing-file record when index points to absent source', async () => {
      mock.module('../../src/utils/db', () => ({
        ...originalDbModule,
        getDb: () =>
          ({
            query: (sql: string) => ({
              all: () =>
                sql.includes('FROM csharp_index')
                  ? [
                      {
                        filePath: '__missing__/Ghost.cs',
                        startLine: 10,
                        typeKind: 'class',
                      },
                    ]
                  : [],
              get: () => undefined,
            }),
          }) as any,
      }))

      try {
        const { readCsharpTypeImpl: mockedReadCsharpTypeImpl } = await import(
          '../../src/tools/read-csharp-type'
        )
        const result = await mockedReadCsharpTypeImpl('GhostType')

        expect(result).toHaveLength(1)
        expect(result[0].fileExists).toBe(false)
        expect(result[0].lineCount).toBe(0)
        expect(result[0].code).toContain('Source file not found')
      } finally {
        mock.module('../../src/utils/db', () => originalDbModule)
      }
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

    test('adds rebuild hint when C# index is unavailable', async () => {
      mock.module('../../src/utils/db', () => ({
        ...originalDbModule,
        getDb: () =>
          ({
            query: (sql: string) => ({
              all: () => [],
              get: () =>
                sql.includes("sqlite_master WHERE type = 'table' AND name = 'csharp_index'")
                  ? undefined
                  : { rowCount: 0 },
            }),
          }) as any,
      }))

      try {
        const { readCsharpType: mockedReadCsharpType } = await import(
          '../../src/tools/read-csharp-type'
        )
        const result = await mockedReadCsharpType('Anything')
        expect(result.content[0].text).toContain('index is unavailable or empty')
      } finally {
        mock.module('../../src/utils/db', () => originalDbModule)
      }
    })
  })
})
