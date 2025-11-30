# RimWorld Source MCP Server

A Model Context Protocol (MCP) server that provides RimWorld source code search and browsing capabilities.

## Quick Setup

Add this MCP server to Claude Code:

```bash
claude mcp add --transport stdio rimworld-source -- bun run /path/to/this/repo
```

Replace `/path/to/this/repo` with the actual path to this repository on your system.

## Development

```bash
# Install dependencies
bun install

# Run development server with auto-reload
bun run dev

# Run production server
bun run start
```

## Available Tools

Once configured, the server provides three tools:

- `search_rimworld_source` - Search through RimWorld source code
- `read_rimworld_file` - Read specific files
- `list_directory` - List directory contents

## Configuration Scopes

Configure in different scopes:

```bash
# Local scope (default, current project only)
claude mcp add --transport stdio rimworld-source -- bun run /path/to/repo

# Project scope (team shared, creates .mcp.json)
claude mcp add --transport stdio rimworld-source --scope project -- bun run /path/to/repo

# User scope (all projects)
claude mcp add --transport stdio rimworld-source --scope user -- bun run /path/to/repo
```

## Verification

Check MCP server status:

```bash
# List all MCP servers
claude mcp list

# Check server details
claude mcp get rimworld-source

# Check in Claude Code
/mcp
```

## Management

```bash
# Remove server
claude mcp remove rimworld-source
```

## Requirements

- Bun runtime
- Ripgrep (for search functionality)