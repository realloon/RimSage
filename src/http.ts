import { serve } from 'bun'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from './server'
import { closeDb } from './utils/db'

let isShuttingDown = false

const server = serve({
  idleTimeout: 120,
  routes: {
    '/health': Response.json({ status: 'ok' }),
    '/health/': Response.json({ status: 'ok' }),
    '/mcp': handleMcpRoute,
    '/mcp/': handleMcpRoute,
    '/*': new Response('Not Found', { status: 404 }),
  },
})

console.error(
  '\x1b[32m%s\x1b[0m',
  `RimWorld Source MCP HTTP server listening on ${server.url}`,
)

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

// #region Helpers
function handleMcpRoute(req: Request, server: Bun.Server<undefined>) {
  // MCP responses may stay open for streaming; disable idle timeout per request.
  server.timeout(req, 0)
  return handleMcpRequest(req)
}

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
  await server.stop(true)
  closeDb()
  process.exit(0)
}
// #endregion