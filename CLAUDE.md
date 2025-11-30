# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides RimWorld source code search and browsing capabilities. It exposes three MCP tools for searching, reading, and listing files within a configured RimWorld source directory.

**Runtime**: Bun (not Node.js)
**Language**: TypeScript with ESNext modules
**Protocol**: MCP over stdio (standard input/output)

## Development Commands

```bash
# Install dependencies
bun install

# Start production server
bun run start

# Start development server with auto-reload
bun run dev
```

## Architecture

### Core Components

**MCP Server** (`src/main.ts`):
- Main entry point that sets up the MCP server using `@modelcontextprotocol/sdk`
- Registers three tools: `search_rimworld_source`, `read_rimworld_file`, `list_directory`
- Uses stdio transport (`StdioServerTransport`) for communication with MCP clients
- Hardcoded to use `assets/` directory as the base path for file operations
- All file operations are protected by the PathSandbox

**PathSandbox** (`src/security/path-sandbox.ts`):
- Security module that prevents path traversal attacks
- Validates all file paths to ensure they stay within the configured base directory
- Uses `join()` to normalize paths and checks if result starts with base path
- Constructor resolves base path relative to `import.meta.dir` (two levels up)
- All tools must use `sandbox.validateAndResolve()` before accessing files

**Search Tool** (`src/tools/search.ts`):
- Uses ripgrep (`rg`) for fast code searching via Bun's `$` shell template
- Supports regex patterns, file glob filtering, and case sensitivity options
- Truncates results at 400 lines or 100KB to prevent context overflow
- Line-based truncation preserves code integrity (no mid-line cuts)
- Handles ripgrep exit codes (exit code 1 = no results found)
- IMPORTANT: Uses Bun shell syntax: `$\`rg ${args}\`` where args is an array

**Read File Tool** (`src/tools/read-file.ts`):
- Reads complete file contents using `Bun.file()`
- Enforces 200KB character limit
- Provides helpful error messages for ENOENT (file not found) and EISDIR (is directory)

**List Directory Tool** (`src/tools/list-directory.ts`):
- Lists files and subdirectories using Node.js `readdir` with `withFileTypes`
- Returns entries sorted by type (directories first) then by name
- Returns entries with type indicators (file/directory) and relative paths

### Configuration

The base path is hardcoded to `assets/` in `src/main.ts` (line 10). To change the source directory, modify the PathSandbox constructor argument.

### Security Model

All file operations go through PathSandbox:
1. User provides relative path
2. PathSandbox resolves it to absolute path
3. PathSandbox verifies the resolved path starts with base path
4. If validation fails, throws error preventing access
5. If validation succeeds, returns safe absolute path for file operations

This prevents attacks like `../../../etc/passwd` from escaping the configured directory.

## Key Implementation Details

- **Bun-specific APIs**: Uses `$` template literal for shell commands and `Bun.file()` for file reading
- **MCP Transport**: Uses stdio transport (`StdioServerTransport`), not HTTP/SSE
- **Error Handling**: Tools throw errors which are caught by the MCP SDK and returned to clients
- **Output Limits**: Search results capped at 400 lines or 100KB, file reads at 200KB to prevent LLM context overflow
- **Module System**: Uses ESNext modules (`type: "module"` in package.json), all imports need `.js` extensions for SDK imports
- **Cross-platform Paths**: `path.join()` handles both Windows backslashes and POSIX forward slashes automatically

## Testing the Server

This MCP server uses stdio transport and must be configured in an MCP client (like Claude Desktop or Claude Code).

Example configuration for Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "rimworld-source": {
      "command": "bun",
      "args": ["run", "/path/to/this/repo/src/main.ts"]
    }
  }
}
```

The server will log to stderr when it starts:
```
RimWorld Source MCP Agent running on Stdio...
Base path: /absolute/path/to/assets/
```
