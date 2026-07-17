import { XMLParser } from 'fast-xml-parser'
import XMLBuilder from 'fast-xml-builder'

export const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
  isArray: (tag, path, _, isAttribute) => {
    if (isAttribute) return false
    if (tag === 'li') return true

    const parts = path.toString().split('.')
    return parts.length === 2 && parts.at(0) === 'Defs'
  },
})

export const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
})
