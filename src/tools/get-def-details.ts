import { getDb, type DefsRow } from '../utils/db'
import { builder } from '../utils/xml-utils'
import { type SqlNamedParams } from '../types'
import { textResponse } from '../utils/mcp-response'

type DefDetailRow = Pick<DefsRow, 'defType' | 'payload'>
type GetDefDetailsResponse = ReturnType<typeof textResponse> & {
  isError?: boolean
}

export function getDefDetailsImpl(
  defName: string,
  defType?: string
): DefDetailRow[] {
  const db = getDb()
  const params: SqlNamedParams = { $name: defName }
  let queryStr = 'SELECT defType, payload FROM defs WHERE defName = $name'

  if (defType) {
    queryStr += ' AND defType = $type'
    params.$type = defType
  }

  return db.query<DefDetailRow, SqlNamedParams>(queryStr).all(params)
}

export function getDefDetails(
  defName: string,
  defType?: string,
): GetDefDetailsResponse {
  const rows = getDefDetailsImpl(defName, defType)

  if (rows.length === 0) {
    const errorText = `Def \`${defName}\`${
      defType ? ` (type: ${defType})` : ''
    } not found. Try using 'search_rimworld_source' to verify the exact name.`

    return {
      isError: true,
      ...textResponse(errorText),
    }
  }

  const buildedXml = rows.map(row => {
    const type = row.defType
    const obj = JSON.parse(row.payload)

    delete obj.defType

    return builder.build({ [type]: obj })
  })

  return textResponse(buildedXml.join('\n\n'))
}
