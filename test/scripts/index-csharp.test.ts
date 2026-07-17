import { afterEach, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { write } from 'bun'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rebuildCsharpIndex } from '../../src/scripts/index-csharp'

const tempDirs: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'rimsage-index-csharp-'))
  tempDirs.push(dir)
  return dir
}

describe('index-csharp script', () => {
  afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
      await rm(dir, { force: true, recursive: true })
    }
  })

  test('rebuilds the index from the current source tree', async () => {
    const tempRoot = await makeTempDir()
    const sourceRoot = join(tempRoot, 'Source')
    const dbPath = join(tempRoot, 'index.db')

    await mkdir(join(sourceRoot, 'Verse'), { recursive: true })
    await write(
      join(sourceRoot, 'Verse', 'Alpha.cs'),
      'namespace Verse;\n\npublic class Alpha\n{\n}\n',
    )

    await rebuildCsharpIndex(dbPath, sourceRoot)

    await write(
      join(sourceRoot, 'Verse', 'Beta.cs'),
      'namespace Verse;\n\npublic class Beta\n{\n}\n',
    )
    await rm(join(sourceRoot, 'Verse', 'Alpha.cs'))

    await rebuildCsharpIndex(dbPath, sourceRoot)

    const db = new Database(dbPath, { readonly: true })

    try {
      const alphaCount = db
        .query<
          { rowCount: number },
          []
        >("SELECT COUNT(*) AS rowCount FROM csharp_index WHERE typeName = 'Alpha'")
        .get()
      const betaRow = db
        .query<
          { filePath: string; startLine: number },
          []
        >("SELECT filePath, startLine FROM csharp_index WHERE typeName = 'Beta'")
        .get()
      const totalCount = db
        .query<
          { rowCount: number },
          []
        >('SELECT COUNT(*) AS rowCount FROM csharp_index')
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
