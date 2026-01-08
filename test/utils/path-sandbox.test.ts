import { expect, test, describe } from 'bun:test'
import { PathSandbox } from '../../src/utils/path-sandbox'
import { join, normalize } from 'path'
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

  test('should throw error for complex path traversal', () => {
    expect(() => {
      sandbox.validateAndResolve('Defs/../../../outside.txt')
    }).toThrow('Path traversal detected')
  })

  test('should handle nested valid paths', () => {
    const nested = 'Sub/Folder/File.cs'
    const resolved = sandbox.validateAndResolve(nested)
    expect(resolved).toBe(join(root, 'test-assets', nested))
  })
})
