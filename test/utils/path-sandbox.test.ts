import { expect, test, describe } from 'bun:test'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { join } from 'path'
import { root } from '../../src/utils/env'

describe('PathSandbox', () => {
  const sandbox = new PathSandbox('test-assets')

  test('should resolve valid relative paths', () => {
    const relative = 'Defs/Thing.xml'
    const resolved = sandbox.validateAndResolve(relative)
    expect(resolved).toBe(join(root, 'test-assets', relative))
  })

  test('should throw error for path traversal (..)', () => {
    expect(() => {
      sandbox.validateAndResolve('../outside.txt')
    }).toThrow('Path traversal detected')
  })

  test('should throw error for sibling prefix bypass', () => {
    expect(() => {
      sandbox.validateAndResolve('../test-assets-evil/outside.txt')
    }).toThrow('Path traversal detected')
  })

  test('should throw error for absolute path', () => {
    expect(() => {
      sandbox.validateAndResolve('/etc/passwd')
    }).toThrow('Path traversal detected')
  })
})
