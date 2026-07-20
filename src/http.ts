import { serve } from 'bun'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { createServer } from './server'

const httpServer = serve({
  routes: {
    '/health': Response.json({ status: 'ok' }),
    '/mcp': async (req, bunServer) => {
      // streaming MCP responses can exceed the default request idle timeout.
      bunServer.timeout(req, 0)

      const mcpServer = createServer()
      const transport = new WebStandardStreamableHTTPServerTransport()

      await mcpServer.connect(transport)
      return transport.handleRequest(req)
    },
    '/*': new Response('Not Found', { status: 404 }),
  },
})

console.error(
  '\x1b[32m%s\x1b[0m',
  `RimSage MCP HTTP server listening on ${httpServer.url}`,
)
