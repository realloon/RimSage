import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { listDirectory } from '../../src/tools/list-directory'

const testDir = join(process.cwd(), 'test-temp')

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
    await writeFile(join(testDir, 'file1.txt'), 'content', 'utf-8')
    await writeFile(join(testDir, 'file2.txt'), 'content', 'utf-8')

    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).toContain('file1.txt')
    expect(result.content[0].text).toContain('file2.txt')
  })

  test('should list directories first, then files', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await writeFile(join(testDir, 'file.txt'), 'content', 'utf-8')

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
    await writeFile(join(testDir, '.hidden'), 'content', 'utf-8')
    await writeFile(join(testDir, 'visible.txt'), 'content', 'utf-8')

    const result = await listDirectory(sandbox, '')
    expect(result.content[0].text).not.toContain('.hidden')
    expect(result.content[0].text).toContain('visible.txt')
  })

  test('should limit number of results', async () => {
    for (let i = 0; i < 10; i++) {
      await writeFile(join(testDir, `file${i}.txt`), 'content', 'utf-8')
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
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await writeFile(join(testDir, 'subdir', 'nested.txt'), 'content', 'utf-8')

    const result = await listDirectory(sandbox, 'subdir')
    expect(result.content[0].text).toContain('nested.txt')
  })

  test('should throw error for non-existent directory', async () => {
    await expect(listDirectory(sandbox, 'nonexistent')).rejects.toThrow('Directory not found')
  })

  test('should throw error when path is a file', async () => {
    await writeFile(join(testDir, 'file.txt'), 'content', 'utf-8')

    await expect(listDirectory(sandbox, 'file.txt')).rejects.toThrow('not a directory')
  })
})
