import { readdir } from 'fs/promises'
import { join } from 'path'
import { PathSandbox } from '../utils/path-sandbox'

export async function listDirectory(
  sandbox: PathSandbox,
  relativePath: string = '',
  limit: number = 100
) {
  const fullPath = sandbox.validateAndResolve(relativePath)

  try {
    const files = (await readdir(fullPath, { withFileTypes: true }))
      .filter(f => !f.name.startsWith('.'))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
          return a.isDirectory() ? -1 : 1
        }

        return a.name.localeCompare(b.name)
      })

    const total = files.length
    const slicedFiles = files.slice(0, limit)

    const entries = slicedFiles.map(
      entry =>
        ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: relativePath ? join(relativePath, entry.name) : entry.name,
        } as const)
    )

    // Format output
    const formatted = entries
      .map(e => (e.type === 'directory' ? `${e.name}/` : e.name))
      .join('\n')

    let finalOutput = formatted || 'Directory is empty'

    if (entries.length < total) {
      finalOutput += `\n[TRUNCATED] Showing ${entries.length}/${total} items.`
      finalOutput +=
        '\n(Tip: Increase `limit` or use `search_rimworld_source`.)'
    }

    return {
      content: [{ type: 'text' as const, text: finalOutput }],
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${relativePath || '/'}`)
    }

    if (error.code === 'ENOTDIR') {
      throw new Error(
        `Path is not a directory: ${relativePath}. Use read_rimworld_file tool instead.`
      )
    }

    throw error
  }
}
