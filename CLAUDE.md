# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RIMCP is an MCP (Model Context Protocol) server that provides search and browsing capabilities for RimWorld game source code and Def definitions. It uses:
- **Bun** runtime for TypeScript execution
- **Ripgrep (rg)** for fast source code searching
- **SQLite** for indexed Def and C# type data

## Development Commands

```bash
# Install dependencies
bun install

# Build/rebuild indices (run this after source changes)
bun run build
# Equivalent to: bun run clean && bun run index:defs && bun run index:csharp

# Index individual components
bun run index:defs      # Parse and index RimWorld XML Defs
bun run index:csharp    # Index C# class/struct/interface definitions
bun run clean           # Remove database file

# Run the MCP server
bun run start
```

## Code Architecture

### Entry Point

- `src/main.ts` - MCP server registration and tool setup. Registers 6 tools:
  - `search_rimworld_source` - Regex search via ripgrep
  - `read_rimworld_file` - Read file with pagination
  - `list_directory` - List directory contents
  - `get_def_details` - Get resolved Def XML with inheritance
  - `search_defs` - Search Def indices
  - `read_csharp_type` - Read C# type definition

### Directory Structure

```
src/
├── main.ts              # MCP server entry point
├── tools/               # Tool implementations
│   ├── index.ts
│   ├── search-source.ts
│   ├── read-file.ts
│   ├── list-directory.ts
│   ├── get-def-details.ts
│   ├── search-defs.ts
│   └── read-csharp-type.ts
├── utils/               # Shared utilities
│   ├── path-sandbox.ts  # Path traversal protection
│   ├── db.ts            # SQLite connection management
│   ├── def-resolver.ts  # Def inheritance resolution
│   ├── xml-utils.ts     # XML parsing/serialization
│   └── env.ts           # Path configuration
└── scripts/             # Build scripts
    ├── index-defs.ts    # Build Def index from XML files
    ├── index-csharp.ts  # Build C# type index
    └── clean-db.ts      # Remove database
```

### Key Components

**PathSandbox** (`src/utils/path-sandbox.ts`)
- Security wrapper that prevents path traversal attacks
- All file operations validate paths against `dist/assets` base directory
- Used by `read-file`, `list-directory`, and `search-source` tools

**Def Resolution** (`src/utils/def-resolver.ts`)
- Resolves RimWorld Def inheritance via `@_ParentName` attribute
- Merges parent/child Def properties recursively
- Handles circular inheritance detection
- Returns sorted Def with priority keys (defName, label, description)

**Database** (`src/utils/db.ts`)
- SQLite database at `dist/defs.db`
- Two tables:
  - `defs(defName, defType, label, payload)` - Resolved XML Defs as JSON
  - `csharp_index(typeName, filePath, startLine, typeKind)` - C# type locations
- Readonly mode for runtime, writable for build scripts

**Environment** (`src/utils/env.ts`)
- All paths resolve relative to project root:
  - `dist/assets/Defs` - RimWorld XML Def files
  - `dist/assets/Source` - C# source code
  - `dist/defs.db` - SQLite database

### Data Flow

**Build Process:**
1. `index-defs.ts` scans `dist/assets/Defs/**/*.xml`, parses Defs, resolves inheritance, stores in SQLite
2. `index-csharp.ts` scans `dist/assets/Source/**/*.cs`, extracts type definitions with regex, stores locations

**Runtime:**
1. MCP tool receives request
2. Tool queries SQLite (for Def/C# lookups) or spawns ripgrep process (for source search)
3. Results formatted and returned via MCP protocol

## External Requirements

- **ripgrep (rg)** must be installed and available in PATH for `search_rimworld_source` tool
- **RimWorld game data** must be present in `dist/assets/` (Defs and Source directories)

## Adding New Tools

To add a new MCP tool:
1. Implement function in `src/tools/`
2. Export from `src/tools/index.ts`
3. Register in `src/main.ts` using `server.registerTool()`
4. Use `PathSandbox` for any file operations
