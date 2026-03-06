import { describe, test, expect } from 'bun:test'
import { getDefDetails, getDefDetailsImpl } from '../../src/tools/get-def-details'

describe('get-def-details', () => {
  describe('getDefDetailsImpl', () => {
    test('returns empty array when def is missing', () => {
      const result = getDefDetailsImpl('NonExistentDefNameThatDoesNotExist12345')
      expect(result).toEqual([])
    })

    test('respects defType filter', () => {
      const matched = getDefDetailsImpl('Gun_Revolver', 'ThingDef')
      const unmatched = getDefDetailsImpl('Gun_Revolver', 'RecipeDef')

      expect(matched.length).toBeGreaterThan(0)
      expect(unmatched).toEqual([])
    })

    test('returns JSON payload for existing def', () => {
      const rows = getDefDetailsImpl('Gun_Revolver')
      expect(rows.length).toBeGreaterThan(0)
      expect(() => JSON.parse(rows[0].payload)).not.toThrow()
    })

    test('supports raw and merged payload modes', () => {
      const rawRows = getDefDetailsImpl('Gun_Revolver', 'ThingDef', 'raw')
      const mergedRows = getDefDetailsImpl('Gun_Revolver', 'ThingDef', 'merged')

      expect(rawRows.length).toBeGreaterThan(0)
      expect(mergedRows.length).toBeGreaterThan(0)

      const rawDef = JSON.parse(rawRows[0].payload)
      const mergedDef = JSON.parse(mergedRows[0].payload)

      expect(rawDef['@_ParentName']).toBe('BaseHumanMakeableGun')
      expect(rawDef.alwaysHaulable).toBeUndefined()
      expect(mergedDef.alwaysHaulable).toBe(true)
    })
  })

  describe('getDefDetails', () => {
    test('returns error response when def is missing', () => {
      const result = getDefDetails('NonExistentDefNameThatDoesNotExist12345')
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('not found')
    })

    test('renders merged def XML by default', () => {
      const result = getDefDetails('Gun_Revolver')
      const text = result.content[0].text

      expect(text).toContain('<ThingDef')
      expect(text).toContain('<defName>Gun_Revolver</defName>')
      expect(text).toContain('<alwaysHaulable>true</alwaysHaulable>')
    })

    test('renders raw def XML when requested', () => {
      const result = getDefDetails('Gun_Revolver', 'ThingDef', 'raw')
      const text = result.content[0].text

      expect(text).toContain('<ThingDef')
      expect(text).toContain('<defName>Gun_Revolver</defName>')
      expect(text).toContain('ParentName="BaseHumanMakeableGun"')
      expect(text).not.toContain('<alwaysHaulable>true</alwaysHaulable>')
    })
  })
})
