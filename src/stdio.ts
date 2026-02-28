import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { closeDb } from './utils/db'
import { createServer } from './server'

async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('\x1b[32m%s\x1b[0m', 'RimWorld Source MCP running...')

  const cleanup = () => {
    console.error('Shutting down...')
    closeDb()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

try {
  main()
} catch (error) {
  console.error('Fatal error:', error)
  process.exit(1)
}
