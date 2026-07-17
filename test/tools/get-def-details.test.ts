import { describe, expect, test } from 'bun:test'
import { getDefDetails } from '../../src/tools/get-def-details'

describe('get-def-details', () => {
  test('returns an MCP error when the Def is missing', () => {
    const result = getDefDetails('NonExistentDefNameThatDoesNotExist12345')

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  test('renders raw and merged inheritance modes', () => {
    const raw = getDefDetails('Gun_Revolver', 'ThingDef', 'raw').content[0].text
    const merged = getDefDetails('Gun_Revolver', 'ThingDef').content[0].text

    expect(raw).toContain('ParentName="BaseHumanMakeableGun"')
    expect(raw).not.toContain('<alwaysHaulable>true</alwaysHaulable>')
    expect(merged).toContain('<alwaysHaulable>true</alwaysHaulable>')
  })

  test('renders every Def when a name is shared across types', () => {
    const text = getDefDetails('Nociosphere').content[0].text

    expect(text).toContain('<BodyDef>')
    expect(text).toContain('<ThingDef')
  })
})
