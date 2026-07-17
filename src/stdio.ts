import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { createServer } from './server'

async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('\x1b[32m%s\x1b[0m', 'RimSage MCP running...')
}

await main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
