import { join } from 'path'

export class PathSandbox {
  private readonly basePath: string

  constructor(basePath: string) {
    this.basePath = join(import.meta.dir, '../../', basePath)
  }

  validateAndResolve(relativePath: string): string {
    const fullPath = join(this.basePath, relativePath)

    if (!fullPath.startsWith(this.basePath)) {
      throw new Error(
        `Path traversal detected: "${relativePath}" attempts to escape base directory`
      )
    }

    return fullPath
  }

  getBasePath(): string {
    return this.basePath
  }
}
