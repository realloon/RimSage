import { file } from 'bun'
import { join } from 'path'
import { getDb } from '../utils/db'
import { sourcePath } from '../utils/env'

interface IndexRow {
  filePath: string
  startLine: number
  typeKind: string
}

const MAX_LINES_THRESHOLD = 400

export interface CSharpTypeResult {
  filePath: string
  startLine: number
  lineCount: number
  code: string
  isTruncated: boolean
  fileExists: boolean
}

/**
 * Internal implementation: Query and read C# type definitions
 */
export async function readCsharpTypeImpl(typeName: string): Promise<CSharpTypeResult[]> {
  const db = getDb()
  const rows = db
    .query<IndexRow, any>(
      'SELECT filePath, startLine, typeKind FROM csharp_index WHERE typeName = $name'
    )
    .all({ $name: typeName })

  const results: CSharpTypeResult[] = []

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

    const { code, lineCount } = extractCodeBlock(allLines, row.startLine)
    const isTruncated = lineCount > MAX_LINES_THRESHOLD

    results.push({
      filePath: row.filePath,
      startLine: row.startLine,
      lineCount,
      code,
      isTruncated,
      fileExists: true,
    })
  }

  return results
}

/**
 * External adapter: Convert CSharpTypeResult[] to MCP response format
 */
export async function readCsharpType(typeName: string) {
  const results = await readCsharpTypeImpl(typeName)

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Type '${typeName}' not found in index. Please check the name.`,
        },
      ],
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

  return {
    content: [{ type: 'text' as const, text: output }],
  }
}

// #region Helper

function extractCodeBlock(lines: string[], startLine: number) {
  let buffer: string[] = []
  let braceCount = 0
  let foundStart = false

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    buffer.push(line)

    for (const char of line) {
      if (char === '{') {
        braceCount += 1
        foundStart = true
      } else if (char === '}') {
        braceCount -= 1
      }
    }

    if (foundStart && braceCount === 0) break
  }

  return {
    code: buffer.join('\n'),
    lineCount: buffer.length,
  }
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
    } else {
      if (depth + currentLineDepthChange <= 1) {
        const indent = line.match(/^\s*/)?.[0] || ''
        output.push(`${indent}}`)
      }
    }

    depth += currentLineDepthChange
  }

  return output.join('\n')
}

// #endregion
