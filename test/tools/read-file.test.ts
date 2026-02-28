import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { write } from 'bun'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { readFile, readFileImpl } from '../../src/tools/read-file'

const testDir = join(process.cwd(), 'test-temp-read-file')

describe('read-file', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp-read-file')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('readFileImpl', () => {
    test('reads a file slice with correct metadata', async () => {
      const content = 'line1\nline2\nline3\nline4\nline5'
      await write(join(testDir, 'test.txt'), content)

      const result = await readFileImpl(sandbox, 'test.txt', 1, 3)
      expect(result).toEqual({
        content: 'line2\nline3\nline4',
        totalLines: 5,
        startLine: 1,
        endLine: 4,
      })
    })

    test('normalizes Windows line endings when slicing', async () => {
      const content = 'line1\r\nline2\r\nline3'
      await write(join(testDir, 'test.txt'), content)

      const result = await readFileImpl(sandbox, 'test.txt', 0, 2)
      expect(result.content).toBe('line1\nline2')
      expect(result.totalLines).toBe(3)
    })

    test('treats empty file as one line', async () => {
      await write(join(testDir, 'empty.txt'), '')
      const result = await readFileImpl(sandbox, 'empty.txt')
      expect(result.totalLines).toBe(1)
      expect(result.content).toBe('')
    })

  })

  describe('readFile', () => {
    test('appends truncation and continuation hints when not fully read', async () => {
      const content = 'line1\nline2\nline3\nline4\nline5'
      await write(join(testDir, 'test.txt'), content)

      const result = await readFile(sandbox, 'test.txt', 0, 3)
      const text = result.content[0].text

      expect(text).toContain('line1\nline2\nline3')
      expect(text).toContain('[TRUNCATED] Showing 3/5 lines.')
      expect(text).toContain('`start_line`: 3')
    })

    test('returns out-of-bounds error message without throwing', async () => {
      await write(join(testDir, 'test.txt'), 'line1\nline2')
      const result = await readFile(sandbox, 'test.txt', 10, 10)
      expect(result.content[0].text).toContain('out of bounds')
    })

    test('throws friendly error for missing file', async () => {
      await expect(readFile(sandbox, 'missing.txt')).rejects.toThrow(
        'File not found'
      )
    })

    test('throws friendly error when path is directory', async () => {
      await mkdir(join(testDir, 'subdir'), { recursive: true })
      await expect(readFile(sandbox, 'subdir')).rejects.toThrow(
        'Path is a directory'
      )
    })

    test('propagates sandbox traversal errors', async () => {
      await expect(readFile(sandbox, '../outside.txt')).rejects.toThrow(
        'Path traversal detected'
      )
    })
  })
})
