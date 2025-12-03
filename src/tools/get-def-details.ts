import { db } from '../utils/db'

interface DefRow {
  payload: string
}

export function getDefDetails(defName: string): Record<string, unknown> | null {
  const query = db.query<DefRow, { $name: string }>(
    'SELECT payload FROM defs WHERE defName = $name'
  )

  const row = query.get({ $name: defName })

  return row ? JSON.parse(row.payload) : null
}
