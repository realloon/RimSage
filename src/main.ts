#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { PathSandbox } from './security/path-sandbox'
import { searchSource } from './tools/search'
import { readRimWorldFile } from './tools/read-file'
import { listDirectory } from './tools/list-directory'

const sandbox = new PathSandbox('assets/')

const server = new McpServer({
  name: 'rimworld-source-agent',
  version: '1.0.0',
})

// tool: search
server.registerTool(
  'search_rimworld_source',
  {
    description:
      'Search through RimWorld source code using ripgrep. RECOMMENDED: Start broad, then refine.',
    inputSchema: {
      query: z
        .string()
        .describe(
          "The search pattern (supports regex). Example: 'class Pawn', 'def.*Health'."
        ),
      file_pattern: z
        .string()
        .optional()
        .describe("Optional glob pattern (e.g. '*.cs', 'Defs/**/*.xml')."),
      case_sensitive: z
        .boolean()
        .default(false)
        .describe('Case sensitive search.'),
    },
  },
  async ({ query, file_pattern, case_sensitive }) => {
    const result = await searchSource(
      sandbox,
      query,
      case_sensitive,
      file_pattern
    )
    return {
      content: [{ type: 'text', text: result }],
    }
  }
)

// tool: read file
server.registerTool(
  'read_rimworld_file',
  {
    description:
      'Read content of a file. Supports pagination (reading specific lines) to handle large files efficiently.',
    inputSchema: {
      relative_path: z.string().describe('Relative path from source root.'),
      start_line: z
        .number()
        .optional()
        .default(0)
        .describe('Start reading from this line number. Default: 0.'),
      line_count: z
        .number()
        .optional()
        .default(1000)
        .describe('Number of lines to read. Default: 1000.'),
    },
  },
  async ({ relative_path, start_line, line_count }) => {
    const content = await readRimWorldFile(
      sandbox,
      relative_path,
      start_line,
      line_count
    )
    return {
      content: [{ type: 'text', text: content }],
    }
  }
)

// tool: list dir
server.registerTool(
  'list_directory',
  {
    description: 'List files and subdirectories to explore structure.',
    inputSchema: {
      relative_path: z
        .string()
        .default('')
        .describe('Directory path to list (relative to root).'),
      limit: z
        .number()
        .default(100)
        .describe('Maximum number of items to return. Default: 100.'),
    },
  },
  async ({ relative_path, limit }) => {
    const { entries, total } = await listDirectory(
      sandbox,
      relative_path,
      limit
    )

    const formatted = entries
      .map(e => (e.type === 'directory' ? `${e.name}/` : e.name))
      .join('\n')

    let finalOutput = [formatted || 'Directory is empty']

    if (entries.length < total) {
      const hiddenCount = total - entries.length

      finalOutput.push(
        `\n... [Truncated] ${hiddenCount} more items hidden. (Showing ${entries.length} of ${total} total).`
      )

      finalOutput.push(
        `Tip: Use 'limit' parameter to see more, or filter using 'search_rimworld_source'.`
      )
    } else {
      finalOutput.push(`\n(Total: ${total} items)`)
    }

    return {
      content: [{ type: 'text', text: finalOutput.join('\n') }],
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('\x1b[32m%s\x1b[0m', 'RimWorld Source MCP running...')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
