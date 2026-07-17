import { expect, test, describe } from 'bun:test'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { join } from 'path'
import { root } from '../../src/utils/env'

describe('PathSandbox', () => {
  const sandbox = new PathSandbox('test-assets')

  test('resolves paths inside the sandbox', () => {
    const path = 'Defs/Thing.xml'
    const resolved = sandbox.validateAndResolve(path)
    expect(resolved).toBe(join(root, 'test-assets', path))
  })

  test('rejects paths outside the sandbox', () => {
    for (const path of [
      '../outside.txt',
      '../test-assets-evil/outside.txt',
      '/etc/passwd',
    ]) {
      expect(() => sandbox.validateAndResolve(path)).toThrow(
        'Path traversal detected',
      )
    }
  })
})
