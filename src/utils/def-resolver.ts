type XmlNode = any

export interface Def extends Record<string, unknown> {
  defType?: string
  defName?: string
  label?: string
  '@_Name'?: string
  '@_ParentName'?: string
  '@_Abstract'?: string | boolean
  '@_Inherit'?: string
}

export function processDefs(defs: Def[]): Def[] {
  const resolveSingleDef = createDefResolver(defs)
  return defs.map(resolveSingleDef)
}

// #region Helper
function createDefResolver(allDefs: Def[]) {
  const defMap = new Map(
    allDefs.filter(d => d['@_Name']).map(d => [d['@_Name']!, d])
  )

  const memo = new Map<string, Def>()

  const resolve = (name: string, stack: Set<string>): Def => {
    if (memo.has(name)) return memo.get(name)!

    if (stack.has(name)) {
      throw new Error(
        `Circular inheritance detected: ${Array.from(stack).join(
          ' -> '
        )} -> ${name}`
      )
    }

    const rawDef = defMap.get(name)
    if (!rawDef) {
      throw new Error(`Parent definition "${name}" not found.`)
    }

    const parentName = rawDef['@_ParentName']

    const resolvedDef = parentName
      ? mergeNodes(
          stripParentMeta(resolve(parentName, new Set([...stack, name]))),
          rawDef
        )
      : rawDef

    memo.set(name, resolvedDef)
    return resolvedDef
  }

  return (def: Def) => {
    if (!def['@_ParentName']) return def

    try {
      const parentResolved = resolve(def['@_ParentName'], new Set())
      return mergeNodes(stripParentMeta(parentResolved), def)
    } catch (error) {
      console.warn((error as Error).message)
      return def
    }
  }
}

function isObject(item: unknown) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

function getAllKeys(o1: Record<string, unknown>, o2: Record<string, unknown>) {
  return Array.from(
    new Set([...Object.keys(o1 ?? {}), ...Object.keys(o2 ?? {})])
  )
}

function stripParentMeta(def: Def): Def {
  const { '@_Name': _n, '@_Abstract': _a, '@_ParentName': _p, ...rest } = def
  return rest
}

function mergeNodes(parent: XmlNode, child: XmlNode): XmlNode {
  if (child === undefined || child === null) return parent
  if (parent === undefined || parent === null) return child

  if (Array.isArray(parent) && Array.isArray(child)) {
    return [...parent, ...child]
  }

  if (isObject(parent) && isObject(child)) {
    if (child['@_Inherit'] === 'False') {
      return child
    }

    return getAllKeys(parent, child).reduce(
      (acc, key) => ({
        ...acc,
        [key]: mergeNodes(parent[key], child[key]),
      }),
      {}
    )
  }

  return child
}
// #endregion
