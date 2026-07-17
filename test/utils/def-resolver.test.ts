import { describe, expect, test } from 'bun:test'
import { processDefs, type Def } from '../../src/utils/def-resolver'

describe('def-resolver', () => {
  test('resolves multi-level inheritance and child overrides', () => {
    const defs: Def[] = [
      { '@_Name': 'GrandParent', label: 'base', a: 1 },
      { '@_Name': 'Parent', '@_ParentName': 'GrandParent', b: 2 },
      {
        defName: 'Child',
        '@_ParentName': 'Parent',
        label: 'child',
        c: 3,
      },
    ]

    expect(processDefs(defs)[2]).toMatchObject({
      defName: 'Child',
      label: 'child',
      a: 1,
      b: 2,
      c: 3,
    })
  })

  test('merges inherited lists', () => {
    const defs: Def[] = [
      { '@_Name': 'Base', list: [1, 2] },
      { defName: 'Child', '@_ParentName': 'Base', list: [3] },
    ]

    expect(processDefs(defs)[1].list).toEqual([1, 2, 3])
  })

  test('replaces nodes marked with Inherit=false', () => {
    const defs: Def[] = [
      { '@_Name': 'Base', data: { a: 1, b: 2 } },
      {
        defName: 'Child',
        '@_ParentName': 'Base',
        data: { '@_Inherit': 'false', c: 3 },
      },
    ]

    expect(processDefs(defs)[1].data).toEqual({
      '@_Inherit': 'false',
      c: 3,
    })
  })
})
