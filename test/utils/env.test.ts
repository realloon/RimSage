import { expect, test, describe } from 'bun:test'
import { root, versionPath, defsPath, sourcePath, dbPath } from '../../src/utils/env'
import { join } from 'path'
import { existsSync } from 'node:fs'

describe('env', () => {
  test('root should point to project directory', () => {
    expect(existsSync(join(root, 'package.json'))).toBe(true)
  })

  test('derived paths should match project contract', () => {
    expect(versionPath).toBe(join(root, 'dist', 'Version.txt'))
    expect(defsPath).toBe(join(root, 'dist', 'assets', 'Defs'))
    expect(sourcePath).toBe(join(root, 'dist', 'assets', 'Source'))
    expect(dbPath).toBe(join(root, 'dist', 'defs.db'))
  })
})
