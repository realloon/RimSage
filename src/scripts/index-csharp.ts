import { Database } from 'bun:sqlite'
import { file, Glob } from 'bun'
import { join } from 'path'
import { indexDbPath, sourcePath } from '../utils/env'
import { type SqlNamedParams } from '../types'

const typeRegex =
  /^\s*(?:public|private|protected|internal|abstract|sealed|static|partial|readonly|unsafe|\s)*\s+(class|struct|interface|enum)\s+([a-zA-Z0-9_]+)/

interface CsharpIndexInsertRow {
  $typeName: string
  $filePath: string
  $startLine: number
  $typeKind: string
}
type CsharpIndexInsertParams = SqlNamedParams & CsharpIndexInsertRow

async function main() {
  console.log(`Scanning C# source in: ${sourcePath}`)

  const db = new Database(indexDbPath)

  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS csharp_index (
        typeName TEXT,
        filePath TEXT,
        startLine INTEGER,
        typeKind TEXT,
        PRIMARY KEY (typeName, filePath) 
      );
    `)

    const insert = db.prepare<unknown, CsharpIndexInsertParams>(`
      INSERT OR REPLACE INTO csharp_index (typeName, filePath, startLine, typeKind)
      VALUES ($typeName, $filePath, $startLine, $typeKind)
    `)

    const glob = new Glob('**/*.cs')

    let fileCount = 0
    let typeCount = 0
    const batch: CsharpIndexInsertParams[] = []

    for await (const relativePath of glob.scan({
      cwd: sourcePath,
      onlyFiles: true,
    })) {
      fileCount += 1

      const absolutePath = join(sourcePath, relativePath)

      try {
        const content = await file(absolutePath).text()
        const lines = content.split(/\r?\n/)

        const normalizedPath = relativePath.replaceAll('\\', '/')

        lines.forEach((line, index) => {
          if (line.length < 10) return

          const match = line.match(typeRegex)
          if (match) {
            const typeKind = match[1]
            const typeName = match[2]

            batch.push({
              $typeName: typeName,
              $filePath: normalizedPath,
              $startLine: index, // 0-indexed
              $typeKind: typeKind,
            })
            typeCount++
          }
        })
      } catch (error) {
        console.warn(`Failed to read ${relativePath}:`, error)
      }
    }

    console.log(`Found ${fileCount} files. Writing ${typeCount} types to DB...`)

    const transaction = db.transaction((entries: CsharpIndexInsertParams[]) => {
      for (const entry of entries) {
        insert.run(entry)
      }
    })

    transaction(batch)
    console.log(`Indexing complete.`)
  } finally {
    db.close()
  }
}

await main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
