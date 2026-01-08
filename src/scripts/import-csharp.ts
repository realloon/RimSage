import { argv, Glob, file, write } from 'bun'
import { resolve, sep, join } from 'path'
import { sourcePath } from '../utils/env'

const path = argv.at(2)

if (!path) {
  console.error('please input path')
  process.exit(1)
}

console.log(`Importing C# files...`)

const root = resolve(path)

const glob = new Glob('**/*.cs')

for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true })) {
  if (relativePath.startsWith('_') || relativePath.startsWith('-')) {
    continue
  }

  const source = file(join(root, relativePath))
  const partPath = relativePath.includes(sep)
    ? relativePath
    : join('Global', relativePath)

  await write(join(sourcePath, partPath), source)
}

console.log(`Done!`)
