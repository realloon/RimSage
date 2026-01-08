import { expect, test, describe } from 'bun:test'
import { parser, builder } from '../../src/utils/xml-utils'

describe('xml-utils', () => {
  describe('parser', () => {
    test('should parse XML into object', () => {
      const xml = '<Defs><ThingDef><a>1</a></ThingDef></Defs>'
      const result = parser.parse(xml)
      // Under our isArray rule, children of Defs are always arrays
      expect(result.Defs.ThingDef[0].a).toBe(1)
    })

    test('should treat top-level tags under Defs as arrays', () => {
      const xml = `
        <Defs>
          <ThingDef><li>1</li></ThingDef>
        </Defs>
      `
      const result = parser.parse(xml)
      // isArray rule: parts.length === 2 && parts.at(0) === 'Defs'
      // This means Defs.ThingDef should be an array
      expect(Array.isArray(result.Defs.ThingDef)).toBe(true)
      expect(result.Defs.ThingDef[0].li[0]).toBe(1)
    })

    test('should treat "li" tags as arrays', () => {
      const xml = '<Defs><ThingDef><li>item1</li><li>item2</li></ThingDef></Defs>'
      const result = parser.parse(xml)
      expect(Array.isArray(result.Defs.ThingDef[0].li)).toBe(true)
      expect(result.Defs.ThingDef[0].li).toHaveLength(2)
    })
  })

  describe('builder', () => {
    test('should build XML from object', () => {
      const obj = {
        Defs: {
          ThingDef: {
            defName: 'Test',
          },
        },
      }
      const xml = builder.build(obj)
      expect(xml).toContain('<Defs>')
      expect(xml).toContain('<ThingDef>')
      expect(xml).toContain('<defName>Test</defName>')
    })
  })
})
