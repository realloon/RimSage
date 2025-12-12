import { join } from 'path'
import { root } from './env'

export class PathSandbox {
  readonly #basePath: string

  constructor(basePath: string) {
    this.#basePath = join(root, basePath)
  }

  validateAndResolve(relativePath: string): string {
    const fullPath = join(this.#basePath, relativePath)

    if (!fullPath.startsWith(this.#basePath)) {
      throw new Error(
        `Path traversal detected: "${relativePath}" attempts to escape base directory`
      )
    }

    return fullPath
  }

  get basePath(): string {
    return this.#basePath
  }
}
