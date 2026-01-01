import { Database } from 'bun:sqlite'
import { file, Glob } from 'bun'
import { join } from 'path'
import { dbPath, sourcePath } from '../utils/env'

const typeRegex =
  /^\s*(?:public|private|protected|internal|abstract|sealed|static|partial|readonly|unsafe|\s)*\s+(class|struct|interface|enum)\s+([a-zA-Z0-9_]+)/

async function main() {
  console.log(`Scanning C# source in: ${sourcePath}`)

  const db = new Database(dbPath)

  db.run(`
    CREATE TABLE IF NOT EXISTS csharp_index (
      typeName TEXT,
      filePath TEXT,
      startLine INTEGER,
      typeKind TEXT,
      PRIMARY KEY (typeName, filePath) 
    );
  `)

  const insert = db.prepare(`
    INSERT OR REPLACE INTO csharp_index (typeName, filePath, startLine, typeKind)
    VALUES ($typeName, $filePath, $startLine, $typeKind)
  `)

  const glob = new Glob('**/*.cs')

  let fileCount = 0
  let typeCount = 0
  const batch: any[] = []

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

  const transaction = db.transaction((entries: any[]) => {
    for (const entry of entries) {
      insert.run(entry)
    }
  })

  transaction(batch)
  db.close()

  console.log(`Indexing complete.`)
}

try {
  main()
} catch (error) {
  console.log('Fatal error:', error)
  process.exit(1)
}
