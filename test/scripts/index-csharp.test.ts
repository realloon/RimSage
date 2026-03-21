import { afterEach, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rebuildCsharpIndex } from '../../src/scripts/index-csharp'

const tempDirs: string[] = []

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'rimsage-index-csharp-'))
  tempDirs.push(dir)
  return dir
}

describe('index-csharp script', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()
      if (dir) {
        rmSync(dir, { force: true, recursive: true })
      }
    }
  })

  test('rebuildCsharpIndex drops stale rows before writing fresh results', async () => {
    const tempRoot = makeTempDir()
    const sourceRoot = join(tempRoot, 'Source')
    const dbPath = join(tempRoot, 'index.db')

    mkdirSync(join(sourceRoot, 'Verse'), { recursive: true })
    writeFileSync(
      join(sourceRoot, 'Verse', 'Alpha.cs'),
      'namespace Verse;\n\npublic class Alpha\n{\n}\n',
    )

    await rebuildCsharpIndex(dbPath, sourceRoot)

    writeFileSync(
      join(sourceRoot, 'Verse', 'Beta.cs'),
      'namespace Verse;\n\npublic class Beta\n{\n}\n',
    )
    rmSync(join(sourceRoot, 'Verse', 'Alpha.cs'))

    await rebuildCsharpIndex(dbPath, sourceRoot)

    const db = new Database(dbPath, { readonly: true })

    try {
      const alphaCount = db
        .query<{ rowCount: number }, []>(
          "SELECT COUNT(*) AS rowCount FROM csharp_index WHERE typeName = 'Alpha'",
        )
        .get()
      const betaRow = db
        .query<{ filePath: string; startLine: number }, []>(
          "SELECT filePath, startLine FROM csharp_index WHERE typeName = 'Beta'",
        )
        .get()
      const totalCount = db
        .query<{ rowCount: number }, []>('SELECT COUNT(*) AS rowCount FROM csharp_index')
        .get()

      expect(alphaCount?.rowCount).toBe(0)
      expect(betaRow).toEqual({
        filePath: 'Verse/Beta.cs',
        startLine: 2,
      })
      expect(totalCount?.rowCount).toBe(1)
    } finally {
      db.close()
    }
  })
})
