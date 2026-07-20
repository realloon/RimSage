import type { Database } from 'bun:sqlite'
import type { DefsRow, SqlNamedParams } from '../types'
import { textResponse } from '../utils/mcp-response'

type ResultRow = Pick<DefsRow, 'defName' | 'defType' | 'label'>
type QueryRow = ResultRow & { total: number }

export function searchDefsImpl(
  db: Database,
  query: string,
  defType?: string,
  limit: number = 20,
) {
  let whereClause = '(defName LIKE $q OR label LIKE $q)'

  const params: SqlNamedParams = { $q: `%${query}%`, $limit: limit }

  if (defType) {
    whereClause += ' AND defType = $type'
    params.$type = defType
  }

  const sql = `
    SELECT defName, defType, label, COUNT(*) OVER() AS total
    FROM defs
    WHERE ${whereClause}
    LIMIT $limit
  `
  const rows = db.query<QueryRow, SqlNamedParams>(sql).all(params)
  const total = rows[0]?.total ?? 0
  const results = rows.map(({ total: _, ...row }) => row)

  return { results, total }
}

export function searchDefs(
  db: Database,
  query: string,
  defType?: string,
  limit: number = 20,
) {
  const { results, total } = searchDefsImpl(db, query, defType, limit)

  if (total === 0) {
    return textResponse('No results found. Try a shorter keyword.')
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

  return textResponse(finalOutput)
}
