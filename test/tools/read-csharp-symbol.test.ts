import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { write } from 'bun'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readCsharpSymbol } from '../../src/tools/read-csharp-symbol'

let db: Database
let sourcePath: string

beforeAll(async () => {
  db = new Database(':memory:')
  db.run(`
    CREATE TABLE csharp_index (
      typeName TEXT,
      filePath TEXT,
      startLine INTEGER,
      PRIMARY KEY (typeName, filePath)
    )
  `)

  sourcePath = await mkdtemp(join(tmpdir(), 'rimsage-symbols-'))
  await mkdir(join(sourcePath, 'One'))
  await mkdir(join(sourcePath, 'Two'))

  const sources = new Map([
    [
      'Thing.cs',
      `public class Thing
{
    public virtual void ExposeData()
    {
        Scribe_Defs.Look();
    }
}`,
    ],
    [
      'Alert.cs',
      `public abstract class Alert
{
    public abstract AlertReport GetReport();
}`,
    ],
    ['One/Option.cs', 'public class Option\n{\n}'],
    ['Two/Option.cs', 'public class Option\n{\n}'],
    [
      'LargeType.cs',
      `public class LargeType
{
${Array.from({ length: 400 }, (_, index) => `    public int Field${index};`).join('\n')}
}`,
    ],
  ])

  const insert = db.prepare(`
    INSERT INTO csharp_index (typeName, filePath, startLine)
    VALUES ($typeName, $filePath, 0)
  `)

  for (const [filePath, content] of sources) {
    await write(join(sourcePath, filePath), content)
    insert.run({
      $typeName: filePath.split('/').at(-1)!.replace('.cs', ''),
      $filePath: filePath,
    })
  }
})

afterAll(async () => {
  db.close()
  await rm(sourcePath, { force: true, recursive: true })
})

describe('read-csharp-symbol', () => {
  test('renders a method from an indexed type', async () => {
    const text = (await readCsharpSymbol(db, sourcePath, 'Thing', 'ExposeData'))
      .content[0].text

    expect(text).toContain('// File: Thing.cs')
    expect(text).toContain('public virtual void ExposeData()')
    expect(text).toContain('Scribe_Defs.Look')
  })

  test('renders abstract members that end with semicolons', async () => {
    const text = (await readCsharpSymbol(db, sourcePath, 'Alert', 'GetReport'))
      .content[0].text

    expect(text).toContain('public abstract AlertReport GetReport();')
  })

  test('renders every indexed type with a shared name', async () => {
    const text = (await readCsharpSymbol(db, sourcePath, 'Option')).content[0]
      .text

    expect(text.match(/^\/\/ File:/gm)).toHaveLength(2)
  })

  test('summarizes large type definitions', async () => {
    const text = (await readCsharpSymbol(db, sourcePath, 'LargeType'))
      .content[0].text

    expect(text).toContain('[AUTO-SUMMARY:')
    expect(text).toContain('[SYSTEM NOTE]')
  })

  test('reports a missing member', async () => {
    const text = (
      await readCsharpSymbol(db, sourcePath, 'Thing', 'MissingMethod')
    ).content[0].text

    expect(text).toContain(
      "Method 'MissingMethod' in type 'Thing' not found in index",
    )
  })
})
