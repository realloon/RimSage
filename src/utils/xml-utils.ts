import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (tag, path) => tag === 'li' || tag === path.split('.').at(1),
})
