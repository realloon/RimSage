import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { searchSource } from '../../src/tools/search-source'

const testDir = join(process.cwd(), 'test-temp')

describe('searchSource', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('should find search results in files', async () => {
    await writeFile(join(testDir, 'test.ts'), 'hello world\nfoo bar', 'utf-8')

    const result = await searchSource(sandbox, 'hello')
    expect(result.content[0].text).toContain('hello')
  })

  test('should support case-insensitive search by default', async () => {
    await writeFile(join(testDir, 'test.ts'), 'Hello World', 'utf-8')

    const result = await searchSource(sandbox, 'hello')
    expect(result.content[0].text).toContain('Hello')
  })

  test('should support case-sensitive search', async () => {
    await writeFile(join(testDir, 'test.ts'), 'Hello\nhello', 'utf-8')

    const result1 = await searchSource(sandbox, 'Hello', true)
    expect(result1.content[0].text).toContain('Hello')

    const result2 = await searchSource(sandbox, 'hello', true)
    expect(result2.content[0].text).toContain('hello')
  })

  test('should filter by file pattern', async () => {
    await writeFile(join(testDir, 'test.ts'), 'hello world', 'utf-8')
    await writeFile(join(testDir, 'test.js'), 'hello world', 'utf-8')

    const result = await searchSource(sandbox, 'hello', false, '*.ts')
    expect(result.content[0].text).toContain('test.ts')
    expect(result.content[0].text).not.toContain('test.js')
  })

  test('should return no results message when search finds nothing', async () => {
    await writeFile(join(testDir, 'test.ts'), 'foo bar', 'utf-8')

    const result = await searchSource(sandbox, 'xyz')
    expect(result.content[0].text).toBe('No results found. Try adjusting your search query or file pattern.')
  })

  test('should truncate results when output size exceeds 100KB', async () => {
    const largeContent = 'x'.repeat(200 * 1024)
    await writeFile(join(testDir, 'large.txt'), largeContent, 'utf-8')

    const result = await searchSource(sandbox, 'x')
    expect(result.content[0].text).toContain('[TRUNCATED]')
  })
})
