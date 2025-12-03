import { Database } from 'bun:sqlite'
import { file } from 'bun'
import { readdir, mkdir } from 'fs/promises'
import { join } from 'path'
import { parser } from '../utils/xml-utils'
import { type Def, processDefs } from '../utils/def-resolver'

const dbPath = join(import.meta.dir, '../../dist/defs.db')
const defsRoot = join(import.meta.dir, '../../assets/Defs')

async function build() {
  console.log('Starting build process...')

  // 1. read xmls
  console.log('Scanning XML files...')
  const paths = await readdir(defsRoot, { recursive: true })
  const xmlPaths = paths.filter(path => path.endsWith('.xml'))
  const xmls = await Promise.all(
    xmlPaths.map(async path => file(join(defsRoot, path)).text())
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
  } catch (error) {
    if (error.code !== 'SQLITE_CANTOPEN') throw error

    await mkdir(join(import.meta.dir, '../../dist'))
    db = new Database(dbPath, { create: true })
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS defs (
      defName TEXT PRIMARY KEY,
      defType TEXT,
      label TEXT,
      payload JSON
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
          $defName: def.defName,
          $label: def.label ?? null,
          $payload: JSON.stringify(def),
        })
      })
  })

  transaction(finalDefs)

  console.log(`Build complete!`)
  db.close()
}

build().catch(console.error)
