import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { PathSandbox } from './utils/path-sandbox'
import { db } from './utils/db'
import { sourcePath } from './utils/env'
import { searchSource } from './tools/search-source'
import { readFile } from './tools/read-file'
import { listDirectory } from './tools/list-directory'
import { getDefDetails } from './tools/get-def-details'
import { searchDefs } from './tools/search-defs'
import { readCsharpSymbol } from './tools/read-csharp-symbol'

const name = 'rimsage'
const version = '0.17.0'
const sandbox = new PathSandbox('dist/assets')

function registerToolsAndResources(server: McpServer) {
  // tool: search
  server.registerTool(
    'search_source',
    {
      description: 'Search RimWorld source code using regex.',
      inputSchema: z.object({
        query: z.string().describe('Regex pattern.'),
        file_pattern: z
          .string()
          .optional()
          .describe("Glob filter (e.g. '*.cs', 'Defs/**/*.xml')."),
        case_sensitive: z
          .boolean()
          .default(false)
          .describe('Enforce exact case matching.'),
      }),
    },
    ({ query, file_pattern, case_sensitive }) =>
      searchSource(sandbox, query, case_sensitive, file_pattern),
  )

  // tool: read file
  server.registerTool(
    'read_file',
    {
      description: 'Read source file.',
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            'Path (e.g. `Source/RimWorld/AbilityDef.cs`, `Defs/Core/AbilityDefs/AbilityDefs.xml`).',
          ),
        start_line: z
          .number()
          .int()
          .min(0)
          .max(2_000_000)
          .default(0)
          .describe('0-indexed start line.'),
        line_count: z
          .number()
          .int()
          .min(1)
          .max(2_000)
          .default(400)
          .describe('Max lines to return.'),
      }),
    },
    ({ path, start_line, line_count }) =>
      readFile(sandbox, path, start_line, line_count),
  )

  // tool: list dir
  server.registerTool(
    'list_directory',
    {
      description: 'List contents of a directory.',
      inputSchema: z.object({
        path: z
          .string()
          .default('')
          .describe('Path (e.g. `Source/Verse`). Empty for root.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .default(100)
          .describe('Max items to return.'),
      }),
    },
    ({ path, limit }) => listDirectory(sandbox, path, limit),
  )

  // tool：get def details
  server.registerTool(
    'get_def_details',
    {
      description: 'Get XML of a Def.',
      inputSchema: z.object({
        defName: z.string().describe('Exact defName (e.g. `Gun_Revolver`).'),
        defType: z
          .string()
          .optional()
          .describe('Type filter (e.g. `ThingDef`, `JobDef`).'),
        inheritance: z
          .enum(['merged', 'raw'])
          .default('merged')
          .describe('Return merged inheritance or the raw indexed Def.'),
      }),
    },
    ({ defName, defType, inheritance }) =>
      getDefDetails(db, defName, defType, inheritance),
  )

  // tool: search defs
  server.registerTool(
    'search_defs',
    {
      description: 'Search Def indices by partial name or label.',
      inputSchema: z.object({
        query: z.string().describe('Case-insensitive keyword.'),
        defType: z
          .string()
          .optional()
          .describe('Filter by type (e.g. "ThingDef", "JobDef").'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe('Max results to return.'),
      }),
    },
    ({ query, defType, limit }) => searchDefs(db, query, defType, limit),
  )

  // tool: read csharp symbol
  server.registerTool(
    'read_csharp_symbol',
    {
      description: 'Read a C# type or method definition.',
      inputSchema: z.object({
        typeName: z
          .string()
          .describe('Exact type name (e.g. "ThingDef", "JobDriver").'),
        memberName: z
          .string()
          .optional()
          .describe(
            'Optional method name within the type (e.g. "ExposeData", "ConfigErrors").',
          ),
      }),
    },
    ({ typeName, memberName }) =>
      readCsharpSymbol(db, sourcePath, typeName, memberName),
  )

  // Some clients probe resources/* before using tools.
  server.registerResource(
    'manifest',
    'rimsage://manifest',
    {
      title: 'RimSage Manifest',
      description: 'Server metadata and available capabilities.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'rimsage://manifest',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              name,
              version,
              resources: ['rimsage://manifest'],
              tools: [
                'search_source',
                'read_file',
                'list_directory',
                'get_def_details',
                'search_defs',
                'read_csharp_symbol',
              ],
            },
            null,
            2,
          ),
        },
      ],
    }),
  )
}

export function createServer() {
  const server = new McpServer({ name, version })
  registerToolsAndResources(server)
  return server
}
