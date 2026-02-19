import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { closeDb } from './utils/db'
import { server } from './server'

const transport = new WebStandardStreamableHTTPServerTransport()

await server.connect(transport)

Bun.serve({
  port: 3000,
  idleTimeout: 120,
  fetch: req => {
    const url = new URL(req.url)
    const pathname = normalizePath(url.pathname)

    if (pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (pathname === '/mcp') {
      return transport.handleRequest(req)
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.error(
  '\x1b[32m%s\x1b[0m',
  'RimWorld Source MCP HTTP server listening on port 3000',
)

const cleanup = () => {
  console.error('Shutting down...')
  closeDb()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

function normalizePath(pathname: string) {
  if (!pathname.endsWith('/')) return pathname
  return pathname.slice(0, -1) || '/'
}
