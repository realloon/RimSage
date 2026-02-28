import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { write } from 'bun'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { listDirectory, listDirectoryImpl } from '../../src/tools/list-directory'

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

  describe('listDirectoryImpl', () => {
    test('sorts directories first, hides dotfiles, and builds relative paths', async () => {
      await mkdir(join(testDir, 'subdir'), { recursive: true })
      await write(join(testDir, 'a.txt'), 'content')
      await write(join(testDir, '.hidden'), 'hidden')
      await write(join(testDir, 'subdir', 'nested.txt'), 'nested')

      const rootResult = await listDirectoryImpl(sandbox, '')
      expect(rootResult.total).toBe(2)
      expect(rootResult.entries.map(e => `${e.type}:${e.name}`)).toEqual([
        'directory:subdir',
        'file:a.txt',
      ])

      const subdirResult = await listDirectoryImpl(sandbox, 'subdir')
      expect(subdirResult.entries[0]).toEqual({
        name: 'nested.txt',
        type: 'file',
        path: join('subdir', 'nested.txt'),
      })
    })

    test('applies limit without losing total count', async () => {
      for (let i = 0; i < 5; i++) {
        await write(join(testDir, `file${i}.txt`), 'content')
      }

      const result = await listDirectoryImpl(sandbox, '', 2)
      expect(result.entries).toHaveLength(2)
      expect(result.total).toBe(5)
    })

    test('returns empty result for empty directory', async () => {
      const result = await listDirectoryImpl(sandbox, '')
      expect(result).toEqual({ entries: [], total: 0 })
    })
  })

  describe('listDirectory', () => {
    test('formats directories with trailing slash', async () => {
      await mkdir(join(testDir, 'subdir'), { recursive: true })
      await write(join(testDir, 'a.txt'), 'content')

      const result = await listDirectory(sandbox, '')
      expect(result.content[0].text).toBe('subdir/\na.txt')
    })

    test('appends truncation hint when limited', async () => {
      for (let i = 0; i < 3; i++) {
        await write(join(testDir, `file${i}.txt`), 'content')
      }

      const result = await listDirectory(sandbox, '', 1)
      expect(result.content[0].text).toContain('[TRUNCATED] Showing 1/3 items.')
    })

    test('maps missing directory to friendly error', async () => {
      await expect(listDirectory(sandbox, 'missing')).rejects.toThrow(
        'Directory not found'
      )
    })

    test('maps file path to not-a-directory error', async () => {
      await write(join(testDir, 'file.txt'), 'content')

      await expect(listDirectory(sandbox, 'file.txt')).rejects.toThrow(
        'Path is not a directory'
      )
    })
  })
})
