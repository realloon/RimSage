import { describe, expect, test } from 'bun:test'
import { readCsharpSymbol } from '../../src/tools/read-csharp-symbol'

describe('read-csharp-symbol', () => {
  test('renders a method from an indexed type', async () => {
    const text = (await readCsharpSymbol('Thing', 'ExposeData')).content[0].text

    expect(text).toContain('// File: Verse/Thing.cs')
    expect(text).toContain('public virtual void ExposeData()')
    expect(text).toContain('Scribe_Defs.Look')
  })

  test('renders abstract members that end with semicolons', async () => {
    const text = (await readCsharpSymbol('Alert', 'GetReport')).content[0].text

    expect(text).toContain('public abstract AlertReport GetReport();')
  })

  test('renders every indexed type with a shared name', async () => {
    const text = (await readCsharpSymbol('Option')).content[0].text

    expect(text.match(/^\/\/ File:/gm)?.length ?? 0).toBeGreaterThan(1)
  })

  test('summarizes large type definitions', async () => {
    const text = (await readCsharpSymbol('ThingDef')).content[0].text

    expect(text).toContain('[AUTO-SUMMARY:')
    expect(text).toContain('[SYSTEM NOTE]')
  })

  test('reports a missing member', async () => {
    const text = (
      await readCsharpSymbol('Thing', 'MethodThatDoesNotExist12345')
    ).content[0].text

    expect(text).toContain(
      "Method 'MethodThatDoesNotExist12345' in type 'Thing' not found in index",
    )
  })
})
