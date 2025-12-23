import { file } from 'bun'
import { join } from 'path'
import { getDb } from '../utils/db'
import { sourcePath } from '../utils/env'

const MAX_LINES_THRESHOLD = 400

interface IndexRow {
  filePath: string
  startLine: number
  typeKind: string
}

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

  // 2. 提取代码
  const parts: string[] = []
  let isTruncatedMode = false

  // 处理可能存在的 partial classes (分多个文件)
  for (const row of rows) {
    const fullPath = join(sourcePath, row.filePath)

    // 简单的错误处理，防止文件丢失导致崩溃
    if (!(await file(fullPath).exists())) {
      parts.push(`// Error: Source file not found: ${row.filePath}`)
      continue
    }

    const content = await file(fullPath).text()
    const allLines = content.split(/\r?\n/)

    // 提取类块
    const { code, lineCount } = extractCodeBlock(allLines, row.startLine)

    let finalCode = code
    let header = `// File: ${row.filePath} (Lines ${row.startLine + 1}-${
      row.startLine + lineCount
    })`

    // 3. 自动降级逻辑
    if (lineCount > MAX_LINES_THRESHOLD) {
      isTruncatedMode = true
      finalCode = generateSignature(code)
      header += ` [AUTO-SUMMARY: Hidden method bodies due to size]`
    }

    parts.push(`${header}\n${finalCode}`)
  }

  let output = parts.join('\n\n')

  // 4. 添加底部提示
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
    // 计算这一行的括号变化
    let currentLineDepthChange = 0
    for (const char of line) {
      if (char === '{') currentLineDepthChange++
      if (char === '}') currentLineDepthChange--
    }

    // 策略：我们只保留 depth 为 0 (类定义行) 和 depth 为 1 (成员定义行) 的内容
    // depth 1 且包含 { 表示方法的开始行 -> 保留

    if (depth <= 1) {
      // 这是一个方法的开始行，比如 "public void Tick() {"
      if (depth === 1 && currentLineDepthChange > 0) {
        output.push(line)
        // 视觉上的一行省略号
        if (!line.includes('}')) {
          // 检查是否单行属性比如 { get; set; }
          output.push('    // ... implementation hidden ...')
        }
      } else {
        // 普通的声明行
        output.push(line)
      }
    } else {
      // 在方法体内部
      if (depth + currentLineDepthChange <= 1) {
        // 方法结束行 "}"
        const indent = line.match(/^\s*/)?.[0] || ''
        output.push(`${indent}}`)
      }
    }

    depth += currentLineDepthChange
  }

  return output.join('\n')
}

// #endregion
