import { argv, file, write, Glob } from 'bun'
import { resolve, join, sep } from 'path'
import { versionPath, defsPath } from '../utils/env'

const path = argv.at(2)

if (!path) {
  console.error('please input path')
  process.exit(1)
}

const root = resolve(path)

const version = file(join(root, 'Version.txt'))

if (!(await version.exists())) {
  console.error('"Version.txt" not found, please check the path')
  process.exit(1)
}

const versionText = await version.text()
await write(versionPath, versionText)

const glob = new Glob('Data/*/Defs/**/*.xml')

for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true })) {
  const parts = relativePath.split(/[/\\]/)
  const category = parts[1]
  const defRelativePath = parts.slice(3).join(sep)
  const output = join(defsPath, category, defRelativePath)
  const source = file(join(root, relativePath))

  await write(output, source)
}

console.log(`Done!`)
