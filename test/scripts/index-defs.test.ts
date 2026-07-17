import type { DefsRow } from '../../src/types'
import { expect, test } from 'bun:test'
import { write } from 'bun'
import { Database } from 'bun:sqlite'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rebuildDefsIndex } from '../../src/scripts/index-defs'

test('builds raw and merged Def payloads', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'rimsage-index-defs-'))

  try {
    const defsSourcePath = join(tempRoot, 'Defs')
    const dbPath = join(tempRoot, 'index.db')

    await mkdir(defsSourcePath)
    await write(
      join(defsSourcePath, 'Things.xml'),
      `
        <Defs>
          <ThingDef Name="Base" Abstract="True">
            <label>base</label>
            <statBases><MaxHitPoints>100</MaxHitPoints></statBases>
          </ThingDef>
          <ThingDef ParentName="Base">
            <defName>Child</defName>
            <label>child</label>
          </ThingDef>
        </Defs>
      `,
    )

    await rebuildDefsIndex(dbPath, defsSourcePath)

    const db = new Database(dbPath, { readonly: true })

    try {
      const rows = db.query<DefsRow, []>('SELECT * FROM defs').all()

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        defName: 'Child',
        defType: 'ThingDef',
        label: 'child',
      })

      const raw = JSON.parse(rows[0].rawPayload)
      const merged = JSON.parse(rows[0].mergedPayload)

      expect(raw.statBases).toBeUndefined()
      expect(merged.statBases.MaxHitPoints).toBe(100)
    } finally {
      db.close()
    }
  } finally {
    await rm(tempRoot, { force: true, recursive: true })
  }
})
