import { Database } from 'bun:sqlite'
import { file, Glob } from 'bun'
import { join } from 'path'
import { dbPath, sourcePath } from '../utils/env'

// 匹配类定义的正则
// 捕获组 1: 类型 (class|struct|interface|enum)
// 捕获组 2: 名称
const typeRegex =
  /^\s*(?:public|private|protected|internal|abstract|sealed|static|partial|readonly|unsafe|\s)*\s+(class|struct|interface|enum)\s+([a-zA-Z0-9_]+)/

async function main() {
  console.log(`Scanning C# source in: ${sourcePath}`)

  const db = new Database(dbPath)

  // 建表
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

  // 初始化 Glob，扫描所有 .cs 文件
  const glob = new Glob('**/*.cs')

  let fileCount = 0
  let typeCount = 0
  const batch: any[] = []

  // 使用 scan 迭代器，cwd 设为 sourcePath
  // 这样返回的 relativePath 直接就是 "RimWorld/Pawn.cs" 这种格式
  for await (const relativePath of glob.scan({
    cwd: sourcePath,
    onlyFiles: true,
  })) {
    fileCount++

    // 构建绝对路径用于读取内容
    const absolutePath = join(sourcePath, relativePath)

    try {
      const content = await file(absolutePath).text()
      const lines = content.split(/\r?\n/)

      // 规范化路径分隔符 (Windows 下可能是反斜杠，统一转为正斜杠存储)
      const normalizedPath = relativePath.replaceAll('\\', '/')

      lines.forEach((line, index) => {
        // 性能优化：跳过太短的行
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

  // 批量写入
  const transaction = db.transaction((entries: any[]) => {
    for (const entry of entries) insert.run(entry)
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
