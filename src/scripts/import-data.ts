import { resolve, join } from 'path'
import { argv, file, write } from 'bun'
import { readdir } from 'fs/promises'
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

const dataDir = (
  await readdir(join(root, 'Data'), { withFileTypes: true })
).filter(dirent => dirent.isDirectory())

dataDir.forEach(async dirent => {
  const category = dirent.name
  const gameDefsPath = join(dirent.parentPath, dirent.name, 'Defs')

  const defs = (await readdir(gameDefsPath, { recursive: true })).filter(item =>
    item.endsWith('.xml')
  )

  defs.forEach(async def => {
    const output = join(defsPath, category, def)
    const content = await file(join(gameDefsPath, def)).text()
    await write(output, content)
  })
})

console.log('done')
