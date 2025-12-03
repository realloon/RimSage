import { db } from '../utils/db'
import { builder } from '../utils/xml-utils'

interface DefRow {
  payload: string
}

export function getDefDetails(defName: string): string | null {
  const query = db.query<DefRow, { $name: string }>(
    'SELECT payload FROM defs WHERE defName = $name'
  )

  const row = query.get({ $name: defName })
  if (!row) return null

  const obj = JSON.parse(row.payload)
  const { defType } = obj

  delete obj.defType

  return builder.build({ [defType]: obj })
}
