# RimSage — RimWorld Source MCP Server

[![bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.com/) [![ripgrep](https://img.shields.io/badge/ripgrep-%23000000.svg?style=flat&logo=rust&logoColor=white)](https://github.com/BurntSushi/ripgrep)

An MCP server that provides RimWorld source code search and browsing capabilities.

## Available Tools

The server provides these tools:

- `search_rimworld_source` - Search RimWorld source code
- `read_rimworld_file` - Read specific files
- `list_directory` - List directory contents
- `search_defs` - Search through RimWorld Defs
- `get_def_details` - Get resolved RimWorld Def data
- `read_csharp_type` - Read the C# class/struct/interface definition

## Quick Start

The easiest way to use RimSage is through the online service:

```
https://mcp.rimsage.com/mcp
```

You can find the integration methods for different Agent clients in the [wiki](https://github.com/realloon/RimSage/wiki).
 
Most clients support `mcp.json` configuration:

```json
{
  "mcpServers": {
    "rimworld-source": {
      "url": "https://mcp.rimsage.com/mcp",
    }
  }
}
```

## Self-Hosted

RimSage also supports stdio transport for local deployment.

1. Install dependencies

```sh
bun install
```

2. Build index

```sh
bun run src/scripts/import-defs /path/to/your/rimworld/root/path
bun run src/scripts/import-csharp /path/to/decompiled/source/root/path
bun run build
```

You'll need local RimWorld files and a decompiled C# project, which is allowed under the [RimWorld EULA](https://rimworldgame.com/eula).

3. Add this MCP server

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
bun run start # stdio
bun run start:http # Streamable HTTP
```
