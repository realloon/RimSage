import { getDb, type DefsRow } from '../utils/db'
import { builder } from '../utils/xml-utils'
import { type SqlNamedParams } from '../types'
import { textResponse } from '../utils/mcp-response'

export type DefInheritanceMode = 'merged' | 'raw'

type DefDetailRow = {
  defType: DefsRow['defType']
  payload: string
}
type GetDefDetailsResponse = ReturnType<typeof textResponse> & {
  isError?: boolean
}

export function getDefDetailsImpl(
  defName: string,
  defType?: string,
  inheritance: DefInheritanceMode = 'merged',
): DefDetailRow[] {
  const db = getDb()
  const params: SqlNamedParams = { $name: defName }
  const payloadColumn = inheritance === 'raw' ? 'rawPayload' : 'mergedPayload'
  let queryStr = `SELECT defType, ${payloadColumn} AS payload FROM defs WHERE defName = $name`

  if (defType) {
    queryStr += ' AND defType = $type'
    params.$type = defType
  }

  return db.query<DefDetailRow, SqlNamedParams>(queryStr).all(params)
}

export function getDefDetails(
  defName: string,
  defType?: string,
  inheritance: DefInheritanceMode = 'merged',
): GetDefDetailsResponse {
  const rows = getDefDetailsImpl(defName, defType, inheritance)

  if (rows.length === 0) {
    const errorText = `Def \`${defName}\`${
      defType ? ` (type: ${defType})` : ''
    } not found. Try using 'search_source' to verify the exact name.`

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
