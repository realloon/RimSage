import { spawn } from 'bun'
import { PathSandbox } from '../utils/path-sandbox'

const MAX_OUTPUT_SIZE = 100 * 1024 // 100KB limit
const MAX_RESULT_LINES = 400
const STDERR_CAPTURE_SIZE = 8 * 1024

interface StreamReadResult {
  text: string
  exceeded: boolean
}

export interface SearchSourceRawResult {
  output: string
  exceededOutputLimit: boolean
}

async function readStreamWithLimit(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
  onLimitReached?: () => void,
): Promise<StreamReadResult> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let totalBytes = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    const nextBytes = totalBytes + value.byteLength
    if (nextBytes > maxBytes) {
      const remaining = maxBytes - totalBytes
      if (remaining > 0) {
        text += decoder.decode(value.subarray(0, remaining), { stream: true })
      }
      text += decoder.decode()
      onLimitReached?.()
      await reader.cancel()
      return { text, exceeded: true }
    }

    totalBytes = nextBytes
    text += decoder.decode(value, { stream: true })
  }

  text += decoder.decode()
  return { text, exceeded: false }
}

/**
 * Internal implementation: Execute rg search and return raw result
 */
export async function searchSourceImpl(
  sandbox: PathSandbox,
  query: string,
  caseSensitive: boolean = false,
  filePattern?: string,
): Promise<SearchSourceRawResult> {
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

  let stoppedByLimit = false
  const stopProcess = () => {
    if (stoppedByLimit) return
    stoppedByLimit = true
    try {
      process.kill()
    } catch {
      // Process may already be exiting; ignore.
    }
  }

  const stdoutPromise = process.stdout
    ? readStreamWithLimit(process.stdout, MAX_OUTPUT_SIZE + 1, stopProcess)
    : Promise.resolve({ text: '', exceeded: false })
  const stderrPromise = process.stderr
    ? readStreamWithLimit(process.stderr, STDERR_CAPTURE_SIZE)
    : Promise.resolve({ text: '', exceeded: false })

  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    stdoutPromise,
    stderrPromise,
  ])

  const trimmedStdout = stdout.text.trimEnd()
  if (stdout.exceeded || stoppedByLimit) {
    return {
      output: trimmedStdout,
      exceededOutputLimit: true,
    }
  }

  if (exitCode === 0) {
    return { output: trimmedStdout, exceededOutputLimit: false }
  }

  // rg returns exit code 1 when no results found
  if (exitCode === 1) {
    return { output: '', exceededOutputLimit: false }
  }

  const stderrText = stderr.text.trim()
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
  const { output, exceededOutputLimit } = await searchSourceImpl(
    sandbox,
    query,
    caseSensitive,
    filePattern,
  )

  if (output.length === 0 && !exceededOutputLimit) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No results found. Try adjusting your search query or file pattern.',
        },
      ],
    }
  }

  if (exceededOutputLimit) {
    let truncated = output.substring(0, MAX_OUTPUT_SIZE)
    truncated += '\n\n[TRUNCATED] Output size exceeded 100KB.'
    truncated +=
      '\n(Tip: Refine your search query or add a more specific `file_pattern`.)'
    return {
      content: [{ type: 'text' as const, text: truncated }],
    }
  }

  // lines limited
  const lines = output.split(/\r?\n/)
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

  return {
    content: [{ type: 'text' as const, text: output }],
  }
}
