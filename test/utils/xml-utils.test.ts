import { expect, test, describe } from 'bun:test'
import { parser, builder } from '../../src/utils/xml-utils'

describe('xml-utils', () => {
  describe('parser', () => {
    test('should treat top-level tags under Defs as arrays', () => {
      const xml = `
        <Defs>
          <ThingDef><li>1</li></ThingDef>
        </Defs>
      `
      const result = parser.parse(xml)
      expect(Array.isArray(result.Defs.ThingDef)).toBe(true)
      expect(result.Defs.ThingDef[0].li[0]).toBe(1)
    })

    test('should treat "li" tags as arrays', () => {
      const xml = '<Defs><ThingDef><li>item1</li><li>item2</li></ThingDef></Defs>'
      const result = parser.parse(xml)
      expect(Array.isArray(result.Defs.ThingDef[0].li)).toBe(true)
      expect(result.Defs.ThingDef[0].li).toHaveLength(2)
    })

    test('should preserve def inheritance attributes', () => {
      const xml =
        '<Defs><ThingDef Name="Base"><defName>BaseThing</defName></ThingDef><ThingDef ParentName="Base" Inherit="false"><defName>ChildThing</defName></ThingDef></Defs>'
      const result = parser.parse(xml)

      expect(result.Defs.ThingDef[0]['@_Name']).toBe('Base')
      expect(result.Defs.ThingDef[1]['@_ParentName']).toBe('Base')
      expect(result.Defs.ThingDef[1]['@_Inherit']).toBe('false')
    })
  })

  describe('builder', () => {
    test('should preserve structure in build-parse round trip', () => {
      const obj = {
        Defs: {
          ThingDef: [
            {
              '@_Name': 'Base',
              defName: 'Test',
              li: ['a', 'b'],
            },
            {
              '@_ParentName': 'Base',
              '@_Inherit': 'false',
              defName: 'Child',
            },
          ],
        },
      }

      const parsed = parser.parse(builder.build(obj))
      expect(parsed).toEqual(obj)
    })
  })
})
