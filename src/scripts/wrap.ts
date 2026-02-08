import { file, write } from 'bun'
import { join } from 'path'
import { sourcePath } from './env'

const path = join(sourcePath, 'DelaunatorSharp/Edge.cs')

const content = await file(path).text()
const formated = content.replace(/\n\s*{/g, ' {')

await write(path, formated)
