import { file } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'
import { textResponse } from '../utils/mcp-response'

export async function readFileImpl(
  sandbox: PathSandbox,
  path: string,
  startLine: number = 0,
  lineCount: number = 400,
) {
  const fullPath = sandbox.validateAndResolve(path)
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

export async function readFile(
  sandbox: PathSandbox,
  path: string,
  startLine: number = 0,
  lineCount: number = 400,
) {
  try {
    const result = await readFileImpl(sandbox, path, startLine, lineCount)

    if (startLine >= result.totalLines) {
      return textResponse(
        `[Error] Start line ${startLine} is out of bounds (File has ${result.totalLines} lines).`,
      )
    }

    let outputContent = result.content

    if (result.endLine < result.totalLines) {
      const lines = result.content.split('\n')
      lines.push(
        `\n[TRUNCATED] Showing ${lines.length}/${result.totalLines} lines.`,
      )
      lines.push(
        `(Tip: Continue reading using \`start_line\`: ${result.endLine})`,
      )
      outputContent = lines.join('\n')
    }

    return textResponse(outputContent)
  } catch (error: unknown) {
    const fsError = error as NodeJS.ErrnoException

    if (fsError.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`)
    }

    if (fsError.code === 'EISDIR') {
      throw new Error(
        `Path is a directory: ${path}. Use \`list_directory\` instead.`,
      )
    }

    throw error
  }
}
