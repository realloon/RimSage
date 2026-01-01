import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { readFile } from '../../src/tools/read-file'

const testDir = join(process.cwd(), 'test-temp')

describe('readFile', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('should read file content from start', async () => {
    const content = 'line1\nline2\nline3'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt', 0, 10)
    expect(result.content[0].text).toBe(content)
  })

  test('should read file content from specific line', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt', 2, 2)
    expect(result.content[0].text).toContain('line3')
    expect(result.content[0].text).toContain('line4')
  })

  test('should limit number of lines returned', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt', 0, 3)
    const lines = result.content[0].text.split('\n')
    // Should include 3 lines + truncation message
    expect(lines.length).toBeGreaterThan(3)
    expect(lines).toContain('line1')
    expect(lines).toContain('line2')
    expect(lines).toContain('line3')
    expect(lines).not.toContain('line4')
  })

  test('should add truncation message when file is not fully read', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt', 0, 3)
    expect(result.content[0].text).toContain('[TRUNCATED]')
  })

  test('should return error when start line is out of bounds', async () => {
    const content = 'line1\nline2'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt', 10, 10)
    expect(result.content[0].text).toContain('out of bounds')
  })

  test('should throw error for non-existent file', async () => {
    await expect(readFile(sandbox, 'nonexistent.txt')).rejects.toThrow('File not found')
  })

  test('should throw error when path is a directory', async () => {
    await writeFile(join(testDir, 'test.txt'), 'content', 'utf-8')

    await expect(readFile(sandbox, '')).rejects.toThrow()
  })

  test('should handle empty files', async () => {
    await writeFile(join(testDir, 'empty.txt'), '', 'utf-8')

    const result = await readFile(sandbox, 'empty.txt')
    expect(result.content[0].text).toBe('')
  })

  test('should handle files with Windows line endings', async () => {
    const content = 'line1\r\nline2\r\nline3'
    await writeFile(join(testDir, 'test.txt'), content, 'utf-8')

    const result = await readFile(sandbox, 'test.txt')
    expect(result.content[0].text).toContain('line1')
    expect(result.content[0].text).toContain('line2')
  })
})
