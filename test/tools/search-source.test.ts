import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { write } from 'bun'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { searchSource, searchSourceImpl } from '../../src/tools/search-source'
import { PathSandbox } from '../../src/utils/path-sandbox'

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

  test('supports case-sensitive and case-insensitive searches', async () => {
    await write(join(testDir, 'test.ts'), 'Hello\nhello')

    const insensitive = await searchSourceImpl(sandbox, 'hello')
    const sensitive = await searchSourceImpl(sandbox, 'hello', true)

    expect(insensitive.output).toContain('Hello')
    expect(insensitive.output).toContain('hello')
    expect(sensitive.output).not.toContain('Hello')
    expect(sensitive.output).toContain('hello')
  })

  test('filters results by file pattern', async () => {
    await write(join(testDir, 'test.ts'), 'needle')
    await write(join(testDir, 'test.js'), 'needle')

    const result = await searchSourceImpl(sandbox, 'needle', false, '*.ts')

    expect(result.output).toContain('test.ts')
    expect(result.output).not.toContain('test.js')
  })

  test('returns guidance when nothing matches', async () => {
    await write(join(testDir, 'test.ts'), 'content')

    const text = (await searchSource(sandbox, 'missing')).content[0].text

    expect(text).toBe(
      'No results found. Try adjusting your search query or file pattern.',
    )
  })

  test('limits output by result count', async () => {
    const content = Array.from({ length: 450 }, (_, i) => `hit ${i}`).join('\n')
    await write(join(testDir, 'many.txt'), content)

    const text = (await searchSource(sandbox, 'hit')).content[0].text

    expect(text).toContain('[TRUNCATED] Showing 400/')
  })

  test('limits output by byte size', async () => {
    await write(join(testDir, 'large.txt'), 'x'.repeat(120 * 1024))

    const text = (await searchSource(sandbox, 'x')).content[0].text

    expect(text).toContain('[TRUNCATED] Output size exceeded 100KB.')
  })

  test('propagates invalid regular expressions', async () => {
    await write(join(testDir, 'test.ts'), 'hello')

    expect(searchSource(sandbox, '[abc')).rejects.toThrow()
  })
})
