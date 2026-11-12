import { argv, file, write, Glob } from 'bun'
import { rm } from 'node:fs/promises'
import { resolve, join, sep } from 'node:path'
import { versionPath, defsPath } from '../utils/env'

const path = argv.at(2)

if (!path) {
  console.error('please input path')
  process.exit(1)
}

console.log(`Importing Defs files...`)

const root = resolve(path)

const version = file(join(root, 'Version.txt'))

if (!(await version.exists())) {
  console.error('"Version.txt" not found, please check the path')
  process.exit(1)
}

const glob = new Glob('Data/*/Defs/**/*.xml')
const paths: string[] = []

for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true })) {
  paths.push(relativePath)
}

if (paths.length === 0) {
  console.error('no Def XML files found, aborting')
  process.exit(1)
}

const versionText = await version.text()
await write(versionPath, versionText)

// Imports are snapshots: clear the destination so removed files cannot linger.
await rm(defsPath, { recursive: true, force: true })

const CONCURRENCY = 32

for (let i = 0; i < paths.length; i += CONCURRENCY) {
  await Promise.all(
    paths.slice(i, i + CONCURRENCY).map(relativePath => {
      const parts = relativePath.split(sep)
      const category = parts[1]
      const defRelativePath = parts.slice(3).join(sep)

      return write(
        join(defsPath, category, defRelativePath),
        file(join(root, relativePath)),
      )
    }),
  )
}

console.log(`Done!`)
