# RimWorld Source MCP Server

![bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white) ![ripgrep](https://img.shields.io/badge/ripgrep-%23000000.svg?style=flat&logo=rust&logoColor=white)

A MCP server that provides RimWorld source code search and browsing capabilities.

## Get started

1. Install dependencies:

```sh
bun install
```

2. Add this MCP server:

```sh
# Claude Code
claude mcp add --transport stdio rimworld-source -- bun run /path/to/this/repo

# Gemini CLI
gemini mcp add rimworld-source bun run /path/to/this/repo
```

**Replace** `/path/to/this/repo` with the actual path to this repository on your system.

3. Build Defs index

```sh
bun run index
```

## Available Tools

Once configured, the server provides four tools:

- `search_rimworld_source` - Search through RimWorld source code
- `read_rimworld_file` - Read specific files with pagination
- `list_directory` - List directory contents with pagination
- `get_def_details` - Get resolved RimWorld Def data by defName

## Requirements

- [Bun runtime](https://bun.com/)
- [Ripgrep](https://github.com/BurntSushi/ripgrep)

## Development

```sh
# Run production server
bun run start
```
