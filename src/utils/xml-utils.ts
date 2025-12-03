import { XMLParser, XMLBuilder } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (tag, path) => tag === 'li' || tag === path.split('.').at(1),
})

export const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
})
