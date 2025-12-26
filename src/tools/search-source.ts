import { $ } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'

const MAX_OUTPUT_SIZE = 100 * 1024 // 100KB limit
const MAX_RESULT_LINES = 400

export async function searchSource(
  sandbox: PathSandbox,
  query: string,
  caseSensitive: boolean = false,
  filePattern?: string
) {
  const args = ['--line-number', '--heading', '--color', 'never']

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
    // exec search from the base directory
    const res = await $`cd ${sandbox.basePath} && rg ${args} .`.text()
    const result = res.trim()

    if (result.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No results found. Try adjusting your search query or file pattern.',
          },
        ],
      }
    }

    // lines limited
    const lines = result.split(/\r?\n/)
    if (lines.length > MAX_RESULT_LINES) {
      const truncated = lines.slice(0, MAX_RESULT_LINES)
      truncated.push(
        `\n[TRUNCATED] Showing ${MAX_RESULT_LINES}/${lines.length} results.`
      )
      truncated.push(
        '(Tip: Refine your search query or add a more specific `file_pattern`.)'
      )
      return {
        content: [{ type: 'text' as const, text: truncated.join('\n') }],
      }
    }

    // size limited
    if (result.length > MAX_OUTPUT_SIZE) {
      let truncated = result.substring(0, MAX_OUTPUT_SIZE)
      truncated += '\n\n[TRUNCATED] Output size exceeded 100KB.'
      truncated +=
        '\n(Tip: Refine your search query or add a more specific `file_pattern`.)'
      return {
        content: [{ type: 'text' as const, text: truncated }],
      }
    }

    return {
      content: [{ type: 'text' as const, text: result }],
    }
  } catch (error: any) {
    if (error.exitCode === 1) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No results found. Try adjusting your search query or file pattern.',
          },
        ],
      }
    }

    const errorMessage = error.stderr ? error.stderr.toString() : error.message

    throw new Error(`Search failed: ${errorMessage}`)
  }
}
