import { join } from 'path'

const root = join(import.meta.dir, '../../')
const distPath = join(root, 'dist')

export const versionPath = join(distPath, 'Version.txt')
export const defsPath = join(distPath, 'assets/Defs')
export const dbPath = join(distPath, 'defs.db')
