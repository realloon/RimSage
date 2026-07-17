import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { write } from 'bun'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listDirectory } from '../../src/tools/list-directory'
import { PathSandbox } from '../../src/utils/path-sandbox'

describe('list-directory', () => {
  let testDir: string
  let sandbox: PathSandbox

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'rimsage-list-directory-'))
    sandbox = new PathSandbox(testDir)
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('lists directories first and hides dotfiles', async () => {
    await mkdir(join(testDir, 'subdir'))
    await write(join(testDir, 'a.txt'), 'content')
    await write(join(testDir, '.hidden'), 'hidden')

    const text = (await listDirectory(sandbox)).content[0].text

    expect(text).toBe('subdir/\na.txt')
  })

  test('reports truncated listings', async () => {
    await write(join(testDir, 'a.txt'), 'content')
    await write(join(testDir, 'b.txt'), 'content')

    const text = (await listDirectory(sandbox, '', 1)).content[0].text

    expect(text).toContain('[TRUNCATED] Showing 1/2 items.')
  })

  test('reports an empty directory', async () => {
    const text = (await listDirectory(sandbox)).content[0].text

    expect(text).toBe('Directory is empty')
  })

  test('maps filesystem errors to tool-specific errors', async () => {
    await write(join(testDir, 'file.txt'), 'content')

    expect(listDirectory(sandbox, 'missing')).rejects.toThrow(
      'Directory not found',
    )
    expect(listDirectory(sandbox, 'file.txt')).rejects.toThrow(
      'Path is not a directory',
    )
  })
})
