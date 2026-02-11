import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { PathSandbox } from './utils/path-sandbox'
import {
  searchSource,
  readFile,
  listDirectory,
  getDefDetails,
  searchDefs,
  readCsharpType,
} from './tools'

const sandbox = new PathSandbox('dist/assets')

export const server = new McpServer({
  name: 'rimworld-source',
  version: '0.8.0',
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
  async ({ query, file_pattern, case_sensitive }) =>
    searchSource(sandbox, query, case_sensitive, file_pattern),
)

// tool: read file
server.registerTool(
  'read_rimworld_file',
  {
    description: 'Read source file. Defaults to first 400 lines.',
    inputSchema: {
      relative_path: z
        .string()
        .describe(
          'Path (e.g. `Source/RimWorld/AbilityDef.cs`, `Defs/Core/AbilityDefs/AbilityDefs.xml`).',
        ),
      start_line: z
        .number()
        .optional()
        .default(0)
        .describe('0-indexed start line.'),
      line_count: z
        .number()
        .optional()
        .default(400)
        .describe('Max lines to return.'),
    },
  },
  async ({ relative_path, start_line, line_count }) =>
    await readFile(sandbox, relative_path, start_line, line_count),
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
  async ({ relative_path, limit }) =>
    listDirectory(sandbox, relative_path, limit),
)

// tool：get def details
server.registerTool(
  'get_def_details',
  {
    description:
      'Get fully resolved XML of Def. Merges properties from ParentName inheritance.',
    inputSchema: {
      defName: z.string().describe('Exact defName (e.g. `Gun_Revolver`).'),
      defType: z
        .string()
        .optional()
        .describe('Type filter (e.g. `ThingDef`, `JobDef`).'),
    },
  },
  async ({ defName, defType }) => getDefDetails(defName, defType),
)

// tool: search defs
server.registerTool(
  'search_defs',
  {
    description: 'Search Def indices by partial name or label.',
    inputSchema: {
      query: z.string().describe('Case-insensitive keyword.'),
      defType: z
        .string()
        .optional()
        .describe('Filter by type (e.g. "ThingDef", "JobDef").'),
      limit: z.number().default(20).describe('Max results to return.'),
    },
  },
  async ({ query, defType, limit }) => searchDefs(query, defType, limit),
)

// tool: read csharp type
server.registerTool(
  'read_csharp_type',
  {
    description: 'Read the C# class/struct/interface definition.',
    inputSchema: {
      typeName: z
        .string()
        .describe('Exact type name (e.g. "WeaponTraitDef", "JobDriver").'),
    },
  },
  async ({ typeName }) => await readCsharpType(typeName),
)

// resource: manifest (minimal resources support for clients that probe resources/*)
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
            name: 'rimworld-source',
            version: '0.9.0',
            resources: ['rimsage://manifest'],
            tools: [
              'search_rimworld_source',
              'read_rimworld_file',
              'list_directory',
              'get_def_details',
              'search_defs',
              'read_csharp_type',
            ],
          },
          null,
          2,
        ),
      },
    ],
  }),
)
