import { file } from 'bun'
import { unlink } from 'node:fs/promises'
import { dbPath } from '../utils/env'

async function main() {
  const dbFile = file(dbPath)

  if (await dbFile.exists()) {
    console.log(`Removing database file: ${dbPath}`)
    try {
      await unlink(dbPath)
      console.log('Database successfully deleted.')
      console.log('Run "bun run build" to rebuild.')
    } catch (error) {
      console.error('Failed to delete database:', error)
      process.exit(1)
    }
  } else {
    console.log(`No database found at ${dbPath}. Nothing to clean.`)
  }
}

main().catch(console.error)
