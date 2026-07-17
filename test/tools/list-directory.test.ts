import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { write } from 'bun'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { listDirectory } from '../../src/tools/list-directory'
import { PathSandbox } from '../../src/utils/path-sandbox'

const testDir = join(process.cwd(), 'test-temp-list-directory')

describe('list-directory', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp-list-directory')
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
