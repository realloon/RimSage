import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { write } from 'bun'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile, readFileImpl } from '../../src/tools/read-file'
import { PathSandbox } from '../../src/utils/path-sandbox'

describe('read-file', () => {
  let testDir: string
  let sandbox: PathSandbox

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'rimsage-read-file-'))
    sandbox = new PathSandbox(testDir)
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('reads a line range and normalizes line endings', async () => {
    await write(join(testDir, 'test.txt'), 'line1\r\nline2\r\nline3\r\nline4')

    expect(await readFileImpl(sandbox, 'test.txt', 1, 2)).toEqual({
      content: 'line2\nline3',
      totalLines: 4,
      startLine: 1,
      endLine: 3,
    })
  })

  test('reports truncation and the continuation offset', async () => {
    await write(join(testDir, 'test.txt'), 'line1\nline2\nline3\nline4')

    const text = (await readFile(sandbox, 'test.txt', 0, 2)).content[0].text

    expect(text).toContain('[TRUNCATED] Showing 2/4 lines.')
    expect(text).toContain('`start_line`: 2')
  })

  test('reports an out-of-bounds starting line', async () => {
    await write(join(testDir, 'test.txt'), 'line1\nline2')

    const text = (await readFile(sandbox, 'test.txt', 10, 10)).content[0].text

    expect(text).toContain('out of bounds')
  })

  test('maps filesystem errors to tool-specific errors', async () => {
    await mkdir(join(testDir, 'subdir'))

    expect(readFile(sandbox, 'missing.txt')).rejects.toThrow('File not found')
    expect(readFile(sandbox, 'subdir')).rejects.toThrow('Path is a directory')
  })
})
