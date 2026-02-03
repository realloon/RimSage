# RimWorld Source MCP Server

[![bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.com/) [![ripgrep](https://img.shields.io/badge/ripgrep-%23000000.svg?style=flat&logo=rust&logoColor=white)](https://github.com/BurntSushi/ripgrep)

An MCP server that provides RimWorld source code search and browsing capabilities.

## Available Tools

The server provides these tools:

- `search_rimworld_source` - Search through RimWorld source code
- `read_rimworld_file` - Read specific files with pagination
- `list_directory` - List directory contents with pagination
- `get_def_details` - Get resolved RimWorld Def data by defName
- `search_defs` - Search through RimWorld Defs
- `read_csharp_type` - Read the C# class/struct/interface definition

## Get started

1. Install dependencies:

```sh
bun install
```

2. Build index

```sh
bun run src/scripts/import-defs /path/to/your/rimworld/root/path
bun run src/scripts/import-csharp /path/to/decompiled/source/root/path
bun run build
```

You need local RimWorld files and a decompiled C# project.

3. Add this MCP server:

```sh
# Claude Code
claude mcp add --transport stdio rimworld-source -- bun run /path/to/this/repo

# Gemini CLI
gemini mcp add rimworld-source bun run /path/to/this/repo
```

Most Agent clients support `mcp.json` configuration:

```json
{
  "mcpServers": {
    "rimworld-source": {
      "command": "bun",
      "args": ["run", "/path/to/this/repo"]
    }
  }
}
```

**Replace** `/path/to/this/repo` with the actual path to this repository on your system.

## Requirements

- [Bun runtime](https://bun.com/)
- [Ripgrep](https://github.com/BurntSushi/ripgrep)

## Development

```sh
bun run start
```
