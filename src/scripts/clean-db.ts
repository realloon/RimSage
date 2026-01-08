import { file } from 'bun'
import { unlink } from 'node:fs/promises'
import { dbPath } from '../utils/env'

async function main() {
  const filesToClean = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]

  for (const path of filesToClean) {
    const dbFile = file(path)

    if (await dbFile.exists()) {
      console.log(`Removing file: ${path}`)
      try {
        await unlink(path)
        console.log(`Successfully deleted ${path}`)
      } catch (error) {
        console.error(`Failed to delete ${path}:`, error)
      }
    }
  }

  console.log('Clean complete.')
  console.log('Run "bun run build" to rebuild.')
}

main().catch(console.error)
