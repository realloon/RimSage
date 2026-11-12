import { argv, Glob, file, write } from 'bun'
import { rm } from 'node:fs/promises'
import { resolve, sep, join } from 'node:path'
import { sourcePath } from '../utils/env'

const path = argv.at(2)

if (!path) {
  console.error('please input path')
  process.exit(1)
}

console.log(`Importing C# files...`)

const root = resolve(path)
const glob = new Glob('**/*.cs')
const paths: string[] = []

for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true })) {
  if (relativePath.startsWith('_') || relativePath.startsWith('-')) {
    continue
  }

  paths.push(relativePath)
}

if (paths.length === 0) {
  console.error('no C# files found, aborting')
  process.exit(1)
}

// Imports are snapshots: clear the destination so removed files cannot linger.
await rm(sourcePath, { recursive: true, force: true })

const CONCURRENCY = 32

for (let i = 0; i < paths.length; i += CONCURRENCY) {
  await Promise.all(
    paths.slice(i, i + CONCURRENCY).map(relativePath => {
      const partPath = relativePath.includes(sep)
        ? relativePath
        : join('Global', relativePath)

      return write(join(sourcePath, partPath), file(join(root, relativePath)))
    }),
  )
}

console.log(`Done!`)
