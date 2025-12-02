# RimWorld Source MCP Server

A MCP server that provides RimWorld source code search and browsing capabilities.

## Quick Setup

Install dependencies:

```sh
bun install
```

Add this MCP server:

```sh
# Claude Code
claude mcp add --transport stdio rimworld-source -- bun run /path/to/this/repo

# Gemini CLI
gemini mcp add rimworld-source bun run /path/to/this/repo
```

Replace `/path/to/this/repo` with the actual path to this repository on your system.

## Available Tools

Once configured, the server provides three tools:

- `search_rimworld_source` - Search through RimWorld source code
- `read_rimworld_file` - Read specific files
- `list_directory` - List directory contents

## Requirements

- [Bun runtime](https://bun.com/)
- [Ripgrep](https://github.com/BurntSushi/ripgrep)

## Development

```sh
# Install dependencies
bun install

# Run development server with auto-reload
bun run dev

# Run production server
bun run start
```
