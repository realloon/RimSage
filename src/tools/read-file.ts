import { file } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'

export async function readFile(
  sandbox: PathSandbox,
  relativePath: string,
  startLine: number = 0,
  lineCount: number = 400
): Promise<string> {
  const fullPath = sandbox.validateAndResolve(relativePath)

  try {
    const content = await file(fullPath).text()
    const lines = content.split(/\r?\n/)
    const totalLines = lines.length

    if (startLine >= totalLines) {
      return `[Error] Start line ${startLine} is out of bounds (File has ${totalLines} lines).`
    }

    const endLine = Math.min(startLine + lineCount, totalLines)
    const outputLines = lines.slice(startLine, endLine)

    if (endLine < totalLines) {
      outputLines.push(
        `\n[TRUNCATED] Showing ${outputLines.length}/${totalLines} lines.`
      )
      outputLines.push(
        `(Tip: Continue reading using \`start_line\`: ${endLine})`
      )
    }

    return outputLines.join('\n')
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
