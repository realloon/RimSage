import { PathSandbox } from '../utils/path-sandbox'

export async function readRimWorldFile(
  sandbox: PathSandbox,
  relativePath: string,
  startLine: number = 0,
  lineCount: number = 1000
): Promise<string> {
  const fullPath = sandbox.validateAndResolve(relativePath)

  try {
    const file = Bun.file(fullPath)
    const content = await file.text()

    const lines = content.split(/\r?\n/)
    const totalLines = lines.length

    if (startLine >= totalLines) {
      return `Error: File has ${totalLines} lines. Cannot read starting from line ${
        startLine + 1
      }.`
    }

    const endLine = Math.min(startLine + lineCount, totalLines)
    const selectedLines = lines.slice(startLine, endLine)
    const resultText = selectedLines.join('\n')

    return resultText
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.message?.includes('No such file')) {
      throw new Error(`File not found: ${relativePath}`)
    }

    if (error.code === 'EISDIR') {
      throw new Error(
        `Path is a directory: ${relativePath}. Use list_directory instead.`
      )
    }

    throw error
  }
}
