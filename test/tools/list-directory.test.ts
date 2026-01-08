import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, rm } from 'node:fs/promises'
import { write } from 'bun'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { listDirectory, listDirectoryImpl } from '../../src/tools/list-directory'

const testDir = join(process.cwd(), 'test-temp')

describe('listDirectoryImpl', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('should return directory entries', async () => {
    await write(join(testDir, 'file1.txt'), 'content')
    await write(join(testDir, 'file2.txt'), 'content')

    const result = await listDirectoryImpl(sandbox, '')
    expect(result.entries).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.entries[0].name).toBe('file1.txt')
    expect(result.entries[0].type).toBe('file')
  })

  test('should list directories first, then files', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await write(join(testDir, 'file.txt'), 'content')

    const result = await listDirectoryImpl(sandbox, '')
    expect(result.entries[0].type).toBe('directory')
    expect(result.entries[0].name).toBe('subdir')
    expect(result.entries[1].type).toBe('file')
    expect(result.entries[1].name).toBe('file.txt')
  })

  test('should mark directories with correct type', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true })

    const result = await listDirectoryImpl(sandbox, '')
    expect(result.entries[0].type).toBe('directory')
    expect(result.entries[0].name).toBe('subdir')
  })

  test('should hide dotfiles', async () => {
    await write(join(testDir, '.hidden'), 'content')
    await write(join(testDir, 'visible.txt'), 'content')

    const result = await listDirectoryImpl(sandbox, '')
    expect(result.entries.length).toBe(1)
    expect(result.entries[0].name).toBe('visible.txt')
  })

  test('should limit number of results', async () => {
    for (let i = 0; i < 10; i++) {
      await write(join(testDir, `file${i}.txt`), 'content')
    }

    const result = await listDirectoryImpl(sandbox, '', 5)
    expect(result.entries).toHaveLength(5)
    expect(result.total).toBe(10)
  })

  test('should return empty array for empty directory', async () => {
    const result = await listDirectoryImpl(sandbox, '')
    expect(result.entries).toEqual([])
    expect(result.total).toBe(0)
  })

  test('should list subdirectory contents', async () => {
    await write(join(testDir, 'subdir', 'nested.txt'), 'content')

    const result = await listDirectoryImpl(sandbox, 'subdir')
    expect(result.entries[0].name).toBe('nested.txt')
    expect(result.entries[0].path).toBe(join('subdir', 'nested.txt'))
  })
})

describe('listDirectory', () => {
  let sandbox: PathSandbox

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    sandbox = new PathSandbox('test-temp')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('should list files in directory', async () => {
    await write(join(testDir, 'file1.txt'), 'content')
    await write(join(testDir, 'file2.txt'), 'content')

    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).toContain('file1.txt')
    expect(result.content[0].text).toContain('file2.txt')
  })

  test('should list directories first, then files', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await write(join(testDir, 'file.txt'), 'content')

    const result = await listDirectory(sandbox, '')
    const lines = result.content[0].text.split('\n')
    const subdirIndex = lines.findIndex(l => l.includes('subdir'))
    const fileIndex = lines.findIndex(l => l.includes('file.txt'))
    expect(subdirIndex).toBeLessThan(fileIndex)
  })

  test('should mark directories with trailing slash', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true })

    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).toContain('subdir/')
  })

  test('should hide dotfiles', async () => {
    await write(join(testDir, '.hidden'), 'content')
    await write(join(testDir, 'visible.txt'), 'content')

    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).not.toContain('.hidden')
    expect(result.content[0].text).toContain('visible.txt')
  })

  test('should limit number of results', async () => {
    for (let i = 0; i < 10; i++) {
      await write(join(testDir, `file${i}.txt`), 'content')
    }

    const result = await listDirectory(sandbox, '', 5)
    expect(result.content[0].text).toContain('[TRUNCATED]')
    expect(result.content[0].text).toContain('Showing 5/10')
  })

  test('should return empty message for empty directory', async () => {
    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).toContain('Directory is empty')
  })

  test('should list subdirectory contents', async () => {
    await write(join(testDir, 'subdir', 'nested.txt'), 'content')

    const result = await listDirectory(sandbox, 'subdir')
    expect(result.content[0].text).toContain('nested.txt')
  })

  test('should throw error for non-existent directory', async () => {
    expect(listDirectory(sandbox, 'nonexistent')).rejects.toThrow('Directory not found')
  })

  test('should throw error when path is a file', async () => {
    await write(join(testDir, 'file.txt'), 'content')

    expect(listDirectory(sandbox, 'file.txt')).rejects.toThrow('not a directory')
  })
})
