import { spawn } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'

const MAX_OUTPUT_SIZE = 100 * 1024 // 100KB limit
const MAX_RESULT_LINES = 400

/**
 * Internal implementation: Execute rg search and return raw result
 */
export async function searchSourceImpl(
  sandbox: PathSandbox,
  query: string,
  caseSensitive: boolean = false,
  filePattern?: string,
): Promise<string> {
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
  const process = spawn({
    cmd: ['rg', ...args, '.'],
    cwd: sandbox.basePath,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    process.stdout ? new Response(process.stdout).text() : Promise.resolve(''),
    process.stderr ? new Response(process.stderr).text() : Promise.resolve(''),
  ])

  if (exitCode === 0) {
    return stdout.trim()
  }

  // rg returns exit code 1 when no results found
  if (exitCode === 1) {
    return ''
  }

  const stderrText = stderr.trim()
  if (stderrText.length > 0) {
    throw new Error(`rg failed with exit code ${exitCode}: ${stderrText}`)
  }
  throw new Error(`rg failed with exit code ${exitCode}`)
}

/**
 * External adapter: Convert search result to MCP response format
 */
export async function searchSource(
  sandbox: PathSandbox,
  query: string,
  caseSensitive: boolean = false,
  filePattern?: string,
) {
  const result = await searchSourceImpl(
    sandbox,
    query,
    caseSensitive,
    filePattern,
  )

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
      `\n[TRUNCATED] Showing ${MAX_RESULT_LINES}/${lines.length} results.`,
    )
    truncated.push(
      '(Tip: Refine your search query or add a more specific `file_pattern`.)',
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
}
