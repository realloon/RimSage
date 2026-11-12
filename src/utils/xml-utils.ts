import { XMLParser } from 'fast-xml-parser'
import XMLBuilder from 'fast-xml-builder'

export const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
  jPath: true,
  isArray: (tag, path, _, isAttribute) => {
    if (isAttribute) return false
    if (tag === 'li') return true

    return (
      typeof path === 'string' &&
      path.startsWith('Defs.') &&
      path.indexOf('.', 5) === -1
    )
  },
})

export const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
})
