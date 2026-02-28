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
  })

  describe('getDefDetails', () => {
    test('returns error response when def is missing', () => {
      const result = getDefDetails('NonExistentDefNameThatDoesNotExist12345')
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('not found')
    })

    test('renders def XML for existing def', () => {
      const result = getDefDetails('Gun_Revolver')
      const text = result.content[0].text

      expect(text).toContain('<ThingDef')
      expect(text).toContain('<defName>Gun_Revolver</defName>')
    })
  })
})
