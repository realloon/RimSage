import { getDb } from '../utils/db'
import { builder } from '../utils/xml-utils'

interface DefsRow {
  defName: string
  defType: string
  label: string | null
  payload: string // JSON
}

interface Params {
  $name: string
  $type?: string
}

export function getDefDetailsImpl(
  defName: string,
  defType?: string
): DefsRow[] {
  const db = getDb()
  const params: Params = { $name: defName }
  let queryStr = 'SELECT defType, payload FROM defs WHERE defName = $name'

  if (defType) {
    queryStr += ' AND defType = $type'
    params.$type = defType
  }

  return db.query<DefsRow, any>(queryStr).all(params)
}

export function getDefDetails(defName: string, defType?: string) {
  const rows = getDefDetailsImpl(defName, defType)

  if (rows.length === 0) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Def \`${defName}\`${
            defType ? ` (type: ${defType})` : ''
          } not found. Try using 'search_rimworld_source' to verify the exact name.`,
        },
      ],
    }
  }

  const buildedXml = rows.map(row => {
    const type = row.defType
    const obj = JSON.parse(row.payload)

    delete obj.defType

    return builder.build({ [type]: obj })
  })

  return {
    content: [{ type: 'text' as const, text: buildedXml.join('\n\n') }],
  }
}
