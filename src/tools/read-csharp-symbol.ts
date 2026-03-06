import { file } from 'bun'
import { join } from 'path'
import { getDb } from '../utils/db'
import { sourcePath } from '../utils/env'
import { type SqlNamedParams } from '../types'
import { textResponse } from '../utils/mcp-response'

interface IndexRow {
  filePath: string
  startLine: number
}

interface CodeBlock {
  startLine: number
  lineCount: number
  code: string
}

const MAX_LINES_THRESHOLD = 400

export interface CSharpSymbolResult {
  filePath: string
  startLine: number
  lineCount: number
  code: string
  isTruncated: boolean
  fileExists: boolean
}

/**
 * Internal implementation: Query and read C# type or method definitions
 */
export async function readCsharpSymbolImpl(
  typeName: string,
  memberName?: string,
): Promise<CSharpSymbolResult[]> {
  const rows = getCsharpIndexRows(typeName)
  const results: CSharpSymbolResult[] = []

  for (const row of rows) {
    const fullPath = join(sourcePath, row.filePath)

    if (!(await file(fullPath).exists())) {
      results.push({
        filePath: row.filePath,
        startLine: row.startLine,
        lineCount: 0,
        code: `// Error: Source file not found: ${row.filePath}`,
        isTruncated: false,
        fileExists: false,
      })
      continue
    }

    const content = await file(fullPath).text()
    const allLines = content.split(/\r?\n/)
    const typeBlock = extractScopedBlock(allLines, row.startLine)
    const blocks = memberName
      ? extractNamedMethods(allLines, row.startLine, typeBlock.lineCount, memberName)
      : [typeBlock]

    for (const block of blocks) {
      results.push({
        filePath: row.filePath,
        startLine: block.startLine,
        lineCount: block.lineCount,
        code: memberName ? dedentCode(block.code) : block.code,
        isTruncated: block.lineCount > MAX_LINES_THRESHOLD,
        fileExists: true,
      })
    }
  }

  return results
}

/**
 * External adapter: Convert CSharpSymbolResult[] to MCP response format
 */
export async function readCsharpSymbol(typeName: string, memberName?: string) {
  const results = await readCsharpSymbolImpl(typeName, memberName)

  if (results.length === 0) {
    const health = getCsharpIndexHealth()
    let extraHint = ''

    if (!health.available) {
      extraHint =
        " Note: C# index is unavailable or empty. Run 'bun run index:csharp' to rebuild it."
    }

    const symbolLabel = memberName
      ? `Method '${memberName}' in type '${typeName}'`
      : `Type '${typeName}'`

    return {
      ...textResponse(
        `${symbolLabel} not found in index. Please check the name.${extraHint}`,
      ),
    }
  }

  const parts: string[] = []
  let isTruncatedMode = false

  for (const result of results) {
    let finalCode = result.code
    let header = `// File: ${result.filePath} (Lines ${result.startLine + 1}-${
      result.startLine + result.lineCount
    })`

    if (result.isTruncated) {
      isTruncatedMode = true
      finalCode = generateSignature(result.code)
      header += ` [AUTO-SUMMARY: Hidden method bodies due to size]`
    }

    parts.push(`${header}\n${finalCode}`)
  }

  let output = parts.join('\n\n')

  if (isTruncatedMode) {
    output += `\n\n[SYSTEM NOTE] Some code was automatically summarized because it exceeded the output limit.`
    output += `\nTo read the implementation of a specific method, use the 'read_rimworld_file' tool with the specific line numbers shown above.`
  }

  return textResponse(output)
}

// #region Helpers

function getCsharpIndexRows(typeName: string): IndexRow[] {
  const db = getDb()

  return db
    .query<IndexRow, SqlNamedParams>(
      'SELECT filePath, startLine FROM csharp_index WHERE typeName = $name',
    )
    .all({ $name: typeName })
}

function extractNamedMethods(
  lines: string[],
  typeStartLine: number,
  typeLineCount: number,
  memberName: string,
): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const memberPattern = new RegExp(`\\b${escapeRegExp(memberName)}\\s*\\(`)
  const typeEndLine = typeStartLine + typeLineCount
  let depth = 0

  for (let i = typeStartLine; i < typeEndLine; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (
      i > typeStartLine &&
      depth === 1 &&
      trimmed &&
      !trimmed.startsWith('//') &&
      memberPattern.test(line)
    ) {
      blocks.push(extractScopedBlock(lines, i))
    }

    depth += countBraceDelta(line)
  }

  return blocks
}

function extractScopedBlock(lines: string[], startLine: number): CodeBlock {
  const buffer: string[] = []
  let braceCount = 0
  let foundBrace = false

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    buffer.push(line)
    braceCount += countBraceDelta(line)

    if (line.includes('{')) foundBrace = true

    if (foundBrace && braceCount === 0) {
      break
    }

    if (!foundBrace && trimmed.endsWith(';')) {
      break
    }
  }

  return {
    startLine,
    code: buffer.join('\n'),
    lineCount: buffer.length,
  }
}

function dedentCode(code: string): string {
  const lines = code.split('\n')
  let commonIndent: string | null = null

  for (const line of lines) {
    if (!line.trim()) continue

    const indent = line.match(/^\s*/)?.[0] ?? ''

    if (commonIndent === null) {
      commonIndent = indent
      continue
    }

    while (commonIndent && !indent.startsWith(commonIndent)) {
      commonIndent = commonIndent.slice(0, -1)
    }
  }

  if (!commonIndent) {
    return code
  }

  return lines
    .map(line => (line.startsWith(commonIndent) ? line.slice(commonIndent.length) : line))
    .join('\n')
}

function countBraceDelta(line: string): number {
  let delta = 0

  for (const char of line) {
    if (char === '{') delta += 1
    if (char === '}') delta -= 1
  }

  return delta
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function generateSignature(code: string): string {
  const lines = code.split('\n')
  const output: string[] = []

  let depth = 0

  for (const line of lines) {
    let currentLineDepthChange = 0
    for (const char of line) {
      if (char === '{') currentLineDepthChange++
      if (char === '}') currentLineDepthChange--
    }

    if (depth <= 1) {
      if (depth === 1 && currentLineDepthChange > 0) {
        output.push(line)
        if (!line.includes('}')) {
          output.push('    // ... implementation hidden ...')
        }
      } else {
        output.push(line)
      }
    } else if (depth + currentLineDepthChange <= 1) {
      const indent = line.match(/^\s*/)?.[0] || ''
      output.push(`${indent}}`)
    }

    depth += currentLineDepthChange
  }

  return output.join('\n')
}

function getCsharpIndexHealth() {
  const db = getDb()

  const tableRow = db
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'csharp_index'",
    )
    .get()

  if (!tableRow) {
    return { available: false }
  }

  const countRow = db
    .query<{ rowCount: number }, []>('SELECT COUNT(*) AS rowCount FROM csharp_index')
    .get()

  return {
    available: (countRow?.rowCount ?? 0) > 0,
  }
}

// #endregion
