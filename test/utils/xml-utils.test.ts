import { describe, expect, test } from 'bun:test'
import { builder, parser } from '../../src/utils/xml-utils'

describe('xml-utils', () => {
  test('parses Def collections, list items, and inheritance attributes', () => {
    const xml =
      '<Defs><ThingDef Name="Base"><li>a</li><li>b</li></ThingDef><ThingDef ParentName="Base" Inherit="false"><defName>Child</defName></ThingDef></Defs>'
    const result = parser.parse(xml)

    expect(result.Defs.ThingDef).toEqual([
      { '@_Name': 'Base', li: ['a', 'b'] },
      {
        '@_ParentName': 'Base',
        '@_Inherit': 'false',
        defName: 'Child',
      },
    ])
  })

  test('preserves Def structure through an XML round trip', () => {
    const defs = {
      Defs: {
        ThingDef: [
          { '@_Name': 'Base', defName: 'BaseThing', li: ['a', 'b'] },
          {
            '@_ParentName': 'Base',
            '@_Inherit': 'false',
            defName: 'ChildThing',
          },
        ],
      },
    }

    expect(parser.parse(builder.build(defs))).toEqual(defs)
  })
})
