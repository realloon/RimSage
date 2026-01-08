import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { write } from 'bun'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { readFile, readFileImpl } from '../../src/tools/read-file'

const testDir = join(process.cwd(), 'test-temp')

describe('readFileImpl', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('should return raw file content', async () => {
    const content = 'line1\nline2\nline3'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFileImpl(sandbox, 'test.txt', 0, 10)
    expect(result.content).toBe(content)
    expect(result.totalLines).toBe(3)
    expect(result.startLine).toBe(0)
    expect(result.endLine).toBe(3)
  })

  test('should read file content from specific line', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFileImpl(sandbox, 'test.txt', 2, 2)
    expect(result.content).toContain('line3')
    expect(result.content).toContain('line4')
    expect(result.startLine).toBe(2)
    expect(result.endLine).toBe(4)
  })

  test('should limit number of lines returned', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFileImpl(sandbox, 'test.txt', 0, 3)
    const lines = result.content.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines).toEqual(['line1', 'line2', 'line3'])
  })

  test('should handle empty files', async () => {
    await write(join(testDir, 'empty.txt'), '')

    const result = await readFileImpl(sandbox, 'empty.txt')
    expect(result.content).toBe('')
    expect(result.totalLines).toBe(1) // Empty file is counted as 1 line
  })

  test('should handle files with Windows line endings', async () => {
    const content = 'line1\r\nline2\r\nline3'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFileImpl(sandbox, 'test.txt')
    expect(result.content).toContain('line1')
    expect(result.content).toContain('line2')
    expect(result.totalLines).toBe(3)
  })
})

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
    await write(join(testDir, 'test.txt'), content)

    const result = await readFile(sandbox, 'test.txt', 0, 10)
    expect(result.content[0].text).toBe(content)
  })

  test('should read file content from specific line', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFile(sandbox, 'test.txt', 2, 2)
    expect(result.content[0].text).toContain('line3')
    expect(result.content[0].text).toContain('line4')
  })

  test('should limit number of lines returned', async () => {
    const content = 'line1\nline2\nline3\nline4\nline5'
    await write(join(testDir, 'test.txt'), content)

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
    await write(join(testDir, 'test.txt'), content)

    const result = await readFile(sandbox, 'test.txt', 0, 3)
    expect(result.content[0].text).toContain('[TRUNCATED]')
  })

  test('should return error when start line is out of bounds', async () => {
    const content = 'line1\nline2'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFile(sandbox, 'test.txt', 10, 10)
    expect(result.content[0].text).toContain('out of bounds')
  })

  test('should throw error for non-existent file', async () => {
    await expect(readFile(sandbox, 'nonexistent.txt')).rejects.toThrow('File not found')
  })

  test('should throw error when path is a directory', async () => {
    await write(join(testDir, 'test.txt'), 'content')

    await expect(readFile(sandbox, '')).rejects.toThrow()
  })

  test('should handle empty files', async () => {
    await write(join(testDir, 'empty.txt'), '')

    const result = await readFile(sandbox, 'empty.txt')
    expect(result.content[0].text).toBe('')
  })

  test('should handle files with Windows line endings', async () => {
    const content = 'line1\r\nline2\r\nline3'
    await write(join(testDir, 'test.txt'), content)

    const result = await readFile(sandbox, 'test.txt')
    expect(result.content[0].text).toContain('line1')
    expect(result.content[0].text).toContain('line2')
  })
})
