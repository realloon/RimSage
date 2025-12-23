import { getDb, type DefsRow } from '../utils/db'
import { builder } from '../utils/xml-utils'

interface Params {
  $name: string
  $type?: string
}

export function getDefDetails(defName: string, defType?: string): string[] {
  const db = getDb()
  const params: Params = { $name: defName }
  let queryStr = 'SELECT defType, payload FROM defs WHERE defName = $name'

  if (defType) {
    queryStr += ' AND defType = $type'
    params.$type = defType
  }

  const rows = db.query<DefsRow, any>(queryStr).all(params)

  if (rows.length === 0) return []

  return rows.map(row => {
    const type = row.defType
    const obj = JSON.parse(row.payload)

    delete obj.defType

    return builder.build({ [type]: obj })
  })
}
