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
  name: 'rimworld-source',
  version: '0.5.0',
})

// tool: search
server.registerTool(
  'search_rimworld_source',
  {
    description: 'Search RimWorld source code using regex.',
    inputSchema: {
      query: z.string().describe('Regex pattern.'),
      file_pattern: z
        .string()
        .optional()
        .describe("Glob filter (e.g. '*.cs', 'Defs/**/*.xml')."),
      case_sensitive: z
        .boolean()
        .default(false)
        .describe('Enforce exact case matching.'),
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
    description: 'Read source file. Defaults to first 1000 lines.',
    inputSchema: {
      relative_path: z
        .string()
        .describe(
          'Path (e.g. `Sources/RimWorld/AbilityDef.cs`, `Defs/Core/AbilityDefs/AbilityDefs.xml`).'
        ),
      start_line: z
        .number()
        .optional()
        .default(0)
        .describe('0-indexed start line.'),
      line_count: z
        .number()
        .optional()
        .default(1000)
        .describe('Max lines to return.'),
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
    description: 'List contents of a directory.',
    inputSchema: {
      relative_path: z
        .string()
        .default('')
        .describe('Path (e.g. `Source/Verse`). Empty for root.'),
      limit: z.number().default(100).describe('Max items to return.'),
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

    let finalOutput = formatted || 'Directory is empty'

    if (entries.length < total) {
      finalOutput += `\n[TRUNCATED] Showing ${entries.length}/${total} items.`
      finalOutput +=
        '\n(Tip: Increase `limit` or use `search_rimworld_source`.)'
    }

    return {
      content: [{ type: 'text', text: finalOutput }],
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
