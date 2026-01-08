import { expect, test, describe } from 'bun:test'
import { root, versionPath, defsPath, sourcePath, dbPath } from '../../src/utils/env'
import { join } from 'path'

describe('env', () => {
  test('root path should be defined', () => {
    expect(root).toBeDefined()
    expect(root.length).toBeGreaterThan(0)
  })

  test('paths should be subpaths of root or dist', () => {
    expect(versionPath).toContain('dist')
    expect(defsPath).toContain('assets')
    expect(sourcePath).toContain('assets')
    expect(dbPath).toContain('defs.db')
  })
})
