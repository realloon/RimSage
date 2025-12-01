import { $ } from 'bun'
import { PathSandbox } from '../security/path-sandbox'

const MAX_OUTPUT_SIZE = 100 * 1024 // 100KB limit
const MAX_RESULT_LINES = 400

export async function searchSource(
  sandbox: PathSandbox,
  query: string,
  caseSensitive: boolean = false,
  filePattern?: string
): Promise<string> {
  const args = ['--line-number', '--no-heading', '--color', 'never']

  // case sensitive
  if (caseSensitive) {
    args.push('-s')
  } else {
    args.push('-i')
  }

  // filter pattern
  if (filePattern) {
    args.push('-g', filePattern)
  }

  // search pattern
  args.push('-e', query)

  try {
    // exec search from the base directory to allow relative glob patterns to work
    const result = await $`cd ${sandbox.getBasePath()} && rg ${args} .`.text()

    if (!result || result.trim().length === 0) {
      return 'No results found. Try adjusting your search query or file pattern.'
    }

    // lines limited
    const lines = result.split(/\r?\n/)
    if (lines.length > MAX_RESULT_LINES) {
      const truncatedLines = lines.slice(0, MAX_RESULT_LINES)
      const truncated = truncatedLines.join('\n')
      return `${truncated}\n\n... (Results truncated: showing first ${MAX_RESULT_LINES} of ${lines.length} lines. Please refine your search query or add a more specific file pattern.)`
    }

    // size limited
    if (result.length > MAX_OUTPUT_SIZE) {
      const truncated = result.substring(0, MAX_OUTPUT_SIZE)
      return `${truncated}\n\n... (Results truncated due to size limit. Please refine your search query or add a more specific file pattern.)`
    }

    return result
  } catch (error: any) {
    if (error.exitCode === 1) {
      return 'No results found. Try adjusting your search query or file pattern.'
    }

    throw new Error(`Search failed: ${error.message}`)
  }
}
