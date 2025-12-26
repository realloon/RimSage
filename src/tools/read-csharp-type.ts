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

export async function readCsharpType(typeName: string) {
  const db = getDb()
  const rows = db
    .query<IndexRow, any>(
      'SELECT filePath, startLine, typeKind FROM csharp_index WHERE typeName = $name'
    )
    .all({ $name: typeName })

  if (rows.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Type '${typeName}' not found in index. Please check the name or try 'search_csharp_types' (if available).`,
        },
      ],
    }
  }

  const parts: string[] = []
  let isTruncatedMode = false

  for (const row of rows) {
    const fullPath = join(sourcePath, row.filePath)

    if (!(await file(fullPath).exists())) {
      parts.push(`// Error: Source file not found: ${row.filePath}`)
      continue
    }

    const content = await file(fullPath).text()
    const allLines = content.split(/\r?\n/)

    const { code, lineCount } = extractCodeBlock(allLines, row.startLine)

    let finalCode = code
    let header = `// File: ${row.filePath} (Lines ${row.startLine + 1}-${
      row.startLine + lineCount
    })`

    if (lineCount > MAX_LINES_THRESHOLD) {
      isTruncatedMode = true
      finalCode = generateSignature(code)
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
