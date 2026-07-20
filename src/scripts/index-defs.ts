import type { Def } from '../types'
import { file, Glob } from 'bun'
import { Database } from 'bun:sqlite'
import { join } from 'node:path'
import { defsPath, indexDbPath } from '../utils/env'
import { parser } from '../utils/xml-utils'
import { processDefs } from '../utils/def-resolver'

export async function rebuildDefsIndex(
  dbPath = indexDbPath,
  defsSourcePath = defsPath,
) {
  console.log('Starting build process...')

  // 1. read xmls
  console.log('Scanning XML files...')
  const glob = new Glob('**/*.xml')
  const paths: string[] = []

  for await (const path of glob.scan({ cwd: defsSourcePath })) {
    paths.push(path)
  }

  const xmls = await Promise.all(
    paths.map(async path => file(join(defsSourcePath, path)).text()),
  )

  // 2. flat defs
  console.log(`Parsing ${xmls.length} files...`)
  // Imported files are trusted RimWorld Def XML with a Defs root and tag-derived defType.
  const defs = xmls.flatMap(xml => {
    const defsForFile = parser.parse(xml).Defs as Record<string, Array<Def>>

    return Object.entries(defsForFile).flatMap(([defType, defsForType]) =>
      defsForType.map(def => Object.assign({ defType }, def)),
    )
  })

  // 3. process defs
  console.log(`Resolving inheritance for ${defs.length} defs...`)
  const mergedDefs = processDefs(defs)

  // 4. write in sqlite
  console.log(`Writing to ${dbPath}...`)
  const db = new Database(dbPath)

  try {
    db.run('DROP TABLE IF EXISTS defs;')

    db.run(`
      CREATE TABLE defs (
        defName TEXT,
        defType TEXT,
        label TEXT,
        rawPayload JSON,
        mergedPayload JSON,
        PRIMARY KEY (defName, defType)
      );
    `)

    const insert = db.prepare(`
      INSERT OR REPLACE INTO defs (defName, defType, label, rawPayload, mergedPayload)
      VALUES ($defName, $defType, $label, $rawPayload, $mergedPayload)
    `)

    const transaction = db.transaction(
      (rawDefs: Def[], resolvedDefs: Def[]) => {
        rawDefs.forEach((rawDef, index) => {
          const resolvedDef = resolvedDefs[index]

          if (!resolvedDef.defName) return

          insert.run({
            $defType: resolvedDef.defType!,
            $defName: resolvedDef.defName,
            $label: resolvedDef.label ?? null,
            $rawPayload: JSON.stringify(rawDef),
            $mergedPayload: JSON.stringify(resolvedDef),
          })
        })
      },
    )

    transaction(defs, mergedDefs)

    console.log(`Build complete!`)
  } finally {
    db.close()
  }
}

if (import.meta.main) {
  await rebuildDefsIndex()
}
