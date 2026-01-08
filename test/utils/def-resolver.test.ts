import { expect, test, describe } from 'bun:test'
import { processDefs, type Def } from '../../src/utils/def-resolver'

describe('def-resolver', () => {
  test('should resolve simple inheritance', () => {
    const defs: Def[] = [
      {
        '@_Name': 'Base',
        defType: 'ThingDef',
        label: 'base label',
        description: 'base desc',
      },
      {
        '@_ParentName': 'Base',
        defType: 'ThingDef',
        defName: 'Child',
        label: 'child label',
      },
    ]

    const result = processDefs(defs)
    const child = result.find(d => d.defName === 'Child')

    expect(child).toBeDefined()
    expect(child?.label).toBe('child label') // overridden
    expect(child?.description).toBe('base desc') // inherited
  })

  test('should resolve multi-level inheritance', () => {
    const defs: Def[] = [
      {
        '@_Name': 'GrandParent',
        a: 1,
      },
      {
        '@_Name': 'Parent',
        '@_ParentName': 'GrandParent',
        b: 2,
      },
      {
        defName: 'Child',
        '@_ParentName': 'Parent',
        c: 3,
      },
    ]

    const result = processDefs(defs)
    const child = result.find(d => d.defName === 'Child')

    expect(child?.a).toBe(1)
    expect(child?.b).toBe(2)
    expect(child?.c).toBe(3)
  })

  test('should handle circular inheritance gracefully', () => {
    const defs: Def[] = [
      {
        '@_Name': 'A',
        '@_ParentName': 'B',
      },
      {
        '@_Name': 'B',
        '@_ParentName': 'A',
      },
      {
        defName: 'C',
        '@_ParentName': 'A',
      },
    ]

    // Should not crash, but might log warning and return raw def
    const result = processDefs(defs)
    expect(result).toBeDefined()
  })

  test('should sort keys correctly', () => {
    const def: Def = {
      description: 'desc',
      defName: 'Name',
      label: 'label',
      other: 'other',
    }

    const result = processDefs([def])[0]
    const keys = Object.keys(result)
    
    expect(keys[0]).toBe('defName')
    expect(keys[1]).toBe('label')
    expect(keys[2]).toBe('description')
  })

  test('should handle list merging', () => {
    const defs: Def[] = [
      {
        '@_Name': 'Base',
        list: [1, 2],
      },
      {
        defName: 'Child',
        '@_ParentName': 'Base',
        list: [3],
      },
    ]

    const result = processDefs(defs)[1]
    expect(result.list).toEqual([1, 2, 3])
  })

  test('should respect @_Inherit="false"', () => {
    const defs: Def[] = [
      {
        '@_Name': 'Base',
        data: { a: 1, b: 2 },
      },
      {
        defName: 'Child',
        '@_ParentName': 'Base',
        data: { 
          '@_Inherit': 'false',
          c: 3 
        },
      },
    ]

    const result = processDefs(defs)[1]
    expect(result.data).toEqual({ '@_Inherit': 'false', c: 3 })
    expect((result.data as any).a).toBeUndefined()
  })
})
