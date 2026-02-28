import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { write } from 'bun'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { searchSource, searchSourceImpl } from '../../src/tools/search-source'

const testDir = join(process.cwd(), 'test-temp-search-source')

describe('search-source', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp-search-source')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('searchSourceImpl', () => {
    test('respects case sensitivity switch', async () => {
      await write(join(testDir, 'test.ts'), 'Hello\nhello')

      const caseInsensitive = await searchSourceImpl(sandbox, 'hello')
      expect(caseInsensitive).toContain('Hello')
      expect(caseInsensitive).toContain('hello')

      const caseSensitive = await searchSourceImpl(sandbox, 'hello', true)
      expect(caseSensitive).toContain('hello')
      expect(caseSensitive).not.toContain('Hello')
    })

    test('filters results by file pattern', async () => {
      await write(join(testDir, 'test.ts'), 'needle')
      await write(join(testDir, 'test.js'), 'needle')

      const result = await searchSourceImpl(sandbox, 'needle', false, '*.ts')
      expect(result).toContain('test.ts')
      expect(result).not.toContain('test.js')
    })

    test('returns empty string when nothing matches', async () => {
      await write(join(testDir, 'test.ts'), 'foo bar')
      const result = await searchSourceImpl(sandbox, 'does-not-exist')
      expect(result).toBe('')
    })
  })

  describe('searchSource', () => {
    test('returns short search output without truncation', async () => {
      await write(join(testDir, 'short.txt'), 'alpha\nbeta')

      const raw = await searchSourceImpl(sandbox, 'alpha')
      const result = await searchSource(sandbox, 'alpha')

      expect(result.content[0].text).toBe(raw)
      expect(result.content[0].text).not.toContain('[TRUNCATED]')
    })

    test('returns no-results guidance message', async () => {
      await write(join(testDir, 'test.ts'), 'foo bar')

      const result = await searchSource(sandbox, 'does-not-exist')
      expect(result.content[0].text).toBe(
        'No results found. Try adjusting your search query or file pattern.'
      )
    })

    test('truncates by result line count when matches exceed limit', async () => {
      const content = Array.from({ length: 450 }, (_, i) => `hit ${i}`).join(
        '\n'
      )
      await write(join(testDir, 'many.txt'), content)

      const result = await searchSource(sandbox, 'hit')
      expect(result.content[0].text).toContain('[TRUNCATED] Showing 400/')
    })

    test('truncates by output size when result exceeds 100KB', async () => {
      await write(join(testDir, 'large.txt'), 'x'.repeat(120 * 1024))

      const result = await searchSource(sandbox, 'x')
      expect(result.content[0].text).toContain(
        '[TRUNCATED] Output size exceeded 100KB.'
      )
    })

    test('propagates rg errors for invalid regex', async () => {
      await write(join(testDir, 'test.ts'), 'hello')
      await expect(searchSource(sandbox, '[abc')).rejects.toThrow()
    })
  })
})
