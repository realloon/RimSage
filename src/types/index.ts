type Primitive = string | number | boolean | null | undefined

export type XmlNode = Primitive | XmlNode[] | { [key: string]: XmlNode }

export type XmlObject = Record<string, XmlNode>

export interface Def extends XmlObject {
  defType?: string
  defName?: string
  label?: string
  '@_Name'?: string
  '@_ParentName'?: string
  '@_Abstract'?: string
  '@_Inherit'?: string
}

export interface DefsRow {
  defName: string
  defType: string
  label: string | null
  rawPayload: string
  mergedPayload: string
}

export interface CsharpIndexRow {
  typeName: string
  filePath: string
  startLine: number
  typeKind: string
}

type SqlParamValue =
  | string
  | number
  | bigint
  | boolean
  | NodeJS.TypedArray
  | null

export type SqlNamedParams = Record<string, SqlParamValue>
