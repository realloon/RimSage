import { rm } from 'node:fs/promises'
import { indexDbPath } from '../utils/env'

async function main() {
  await rm(indexDbPath, { force: true })

  console.log('Clean complete.')
  console.log('Run "bun run build" to rebuild.')
}

await main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
