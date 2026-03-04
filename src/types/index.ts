export type SqlParamValue =
  | string
  | number
  | bigint
  | boolean
  | NodeJS.TypedArray
  | null

export type SqlNamedParams = Record<string, SqlParamValue>
