import { serve } from 'bun'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from './server'
import { closeDb } from './utils/db'

let isShuttingDown = false

const server = serve({
  idleTimeout: 60,
  routes: {
    '/health': Response.json({ status: 'ok' }),
    '/mcp': (req, server) => {
      // MCP responses may stay open for streaming; disable idle timeout per request.
      server.timeout(req, 0)
      return handleMcpRequest(req)
    },
    '/*': new Response('Not Found', { status: 404 }),
  },
})

console.error(
  '\x1b[32m%s\x1b[0m',
  `RimSage MCP HTTP server listening on ${server.url}`,
)

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

async function handleMcpRequest(req: Request) {
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport()

  await server.connect(transport)
  return transport.handleRequest(req)
}

async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  console.error('Shutting down...')
  let exitCode = 0

  try {
    await server.stop(true)
  } catch (error) {
    exitCode = 1
    console.error('Failed to stop HTTP server cleanly:', error)
  } finally {
    closeDb()
    process.exit(exitCode)
  }
}
