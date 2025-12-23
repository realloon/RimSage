import { getDb, type DefsRow } from '../utils/db'

interface Params {
  $q: string
  $type?: string
  $limit?: number
}

type ResultRow = Pick<DefsRow, 'defName' | 'defType' | 'label'>

export function searchDefs(
  query: string,
  defType?: string,
  limit: number = 20
): { results: ResultRow[]; total: number } {
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
