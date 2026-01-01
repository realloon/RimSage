import { getDb, type DefsRow } from '../utils/db'

interface Params {
  $q: string
  $type?: string
  $limit?: number
}

type ResultRow = Pick<DefsRow, 'defName' | 'defType' | 'label'>

export interface SearchDefsResult {
  results: ResultRow[]
  total: number
}

/**
 * Internal implementation: Query defs from database
 */
export function searchDefsImpl(
  query: string,
  defType?: string,
  limit: number = 20
): SearchDefsResult {
  const db = getDb()
  let whereClause = '(defName LIKE $q OR label LIKE $q)'

  const params: Params = { $q: `%${query}%` }

  if (defType) {
    whereClause += ' AND defType = $type'
    params.$type = defType
  }

  const countSql = `SELECT COUNT(*) as count FROM defs WHERE ${whereClause}`
  const countRow = db.query<{ count: number }, any>(countSql).get(params)
  const total = countRow?.count ?? 0

  if (total === 0) {
    return { results: [], total: 0 }
  }

  const dataSql = `
    SELECT defName, defType, label
    FROM defs
    WHERE ${whereClause}
    LIMIT $limit
  `
  const results = db
    .query<ResultRow, any>(dataSql)
    .all({ ...params, $limit: limit })

  return { results, total }
}

/**
 * External adapter: Convert SearchDefsResult to MCP response format
 */
export function searchDefs(
  query: string,
  defType?: string,
  limit: number = 20
) {
  const { results, total } = searchDefsImpl(query, defType, limit)

  if (total === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No results found. Try a shorter keyword.',
        },
      ],
    }
  }

  const formatted = results
    .map(r => {
      const labelStr = r.label ? ` (label: "${r.label}")` : ''
      return `[${r.defType}] ${r.defName}${labelStr}`
    })
    .join('\n')

  let finalOutput = formatted

  if (results.length < total) {
    finalOutput += `\n\n[TRUNCATED] Showing ${results.length}/${total} results.`
    finalOutput += '\n(Tip: Increase `limit` or refine query.)'
  }

  return {
    content: [{ type: 'text' as const, text: finalOutput }],
  }
}
