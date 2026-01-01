import { file } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'

export interface ReadFileResult {
  content: string
  totalLines: number
  startLine: number
  endLine: number
}

/**
 * Internal implementation: Read file content
 */
export async function readFileImpl(
  sandbox: PathSandbox,
  relativePath: string,
  startLine: number = 0,
  lineCount: number = 400
): Promise<ReadFileResult> {
  const fullPath = sandbox.validateAndResolve(relativePath)
  const content = await file(fullPath).text()
  const lines = content.split(/\r?\n/)
  const totalLines = lines.length

  const endLine = Math.min(startLine + lineCount, totalLines)
  const outputLines = lines.slice(startLine, endLine)

  return {
    content: outputLines.join('\n'),
    totalLines,
    startLine,
    endLine,
  }
}

/**
 * External adapter: Convert ReadFileResult to MCP response format
 */
export async function readFile(
  sandbox: PathSandbox,
  relativePath: string,
  startLine: number = 0,
  lineCount: number = 400
) {
  try {
    const result = await readFileImpl(
      sandbox,
      relativePath,
      startLine,
      lineCount
    )

    if (startLine >= result.totalLines) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `[Error] Start line ${startLine} is out of bounds (File has ${result.totalLines} lines).`,
          },
        ],
      }
    }

    let outputContent = result.content

    if (result.endLine < result.totalLines) {
      const lines = result.content.split('\n')
      lines.push(
        `\n[TRUNCATED] Showing ${lines.length}/${result.totalLines} lines.`
      )
      lines.push(
        `(Tip: Continue reading using \`start_line\`: ${result.endLine})`
      )
      outputContent = lines.join('\n')
    }

    return {
      content: [{ type: 'text' as const, text: outputContent }],
    }
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.message?.includes('No such file')) {
      throw new Error(`File not found: ${relativePath}`)
    }

    if (error.code === 'EISDIR') {
      throw new Error(
        `Path is a directory: ${relativePath}. Use \`list_directory\` instead.`
      )
    }

    throw error
  }
}
