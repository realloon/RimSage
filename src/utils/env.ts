import { join } from 'path'

export const root = join(import.meta.dir, '../../')
const distPath = join(root, 'dist')

export const versionPath = join(distPath, 'Version.txt')
export const defsPath = join(distPath, 'assets/Defs')
export const sourcePath = join(distPath, 'assets/Source')
export const dbPath = join(distPath, 'defs.db')
