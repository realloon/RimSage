import { Database } from 'bun:sqlite'
import { file } from 'bun'
import { readdir, mkdir } from 'fs/promises'
import { join } from 'path'
import { defsPath, dbPath } from '../utils/env'
import { parser } from '../utils/xml-utils'
import { type Def, processDefs } from '../utils/def-resolver'

async function main() {
  console.log('Starting build process...')

  // 1. read xmls
  console.log('Scanning XML files...')
  const paths = (await readdir(defsPath, { recursive: true })).filter(path =>
    path.endsWith('.xml')
  )
  const xmls = await Promise.all(
    paths.map(async path => file(join(defsPath, path)).text())
  )

  // 2. flat defs
  console.log(`Parsing ${xmls.length} files...`)
  const defs = xmls.flatMap(xml => {
    const parsed = parser.parse(xml)
    if (!parsed || !parsed.Defs) return []

    const defsForFile = parsed.Defs as Record<string, Array<Def>>

    return Object.entries(defsForFile).flatMap(([defType, defsForType]) =>
      defsForType.map(def => Object.assign({ defType }, def))
    )
  })

  // 3. process defs
  console.log(`Resolving inheritance for ${defs.length} defs...`)
  const finalDefs = processDefs(defs)

  // 4. write in sqlite
  console.log(`Writing to ${dbPath}...`)
  let db: Database

  try {
    db = new Database(dbPath, { create: true })
  } catch (error: any) {
    if (error.code !== 'SQLITE_CANTOPEN') throw error

    await mkdir(join(import.meta.dir, '../../dist'))
    db = new Database(dbPath, { create: true })
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS defs (
      defName TEXT,
      defType TEXT,
      label TEXT,
      payload JSON,
      PRIMARY KEY (defName, defType)
    );
  `)

  const insert = db.prepare(`
    INSERT OR REPLACE INTO defs (defName, defType, label, payload)
    VALUES ($defName, $defType, $label, $payload)
  `)

  const transaction = db.transaction((defs: Def[]) => {
    defs
      .filter(def => def.defName)
      .forEach(def => {
        insert.run({
          $defType: def.defType ?? 'Unknown',
          $defName: def.defName!,
          $label: def.label ?? null,
          $payload: JSON.stringify(def),
        })
      })
  })

  transaction(finalDefs)

  console.log(`Build complete!`)
  db.close()
}

main().catch(console.error)
