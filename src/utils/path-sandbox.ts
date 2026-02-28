import { resolve, sep } from 'path'
import { root } from './env'

export class PathSandbox {
  readonly #basePath: string

  constructor(basePath: string) {
    this.#basePath = resolve(root, basePath)
  }

  validateAndResolve(relativePath: string): string {
    const fullPath = resolve(this.#basePath, relativePath)
    const allowedPrefix = `${this.#basePath}${sep}`

    if (fullPath !== this.#basePath && !fullPath.startsWith(allowedPrefix)) {
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
