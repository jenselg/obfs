declare class OBFS {
  constructor(options?: OBFS.Options)

  [key: string]: any

  'obfs:name': string
  'obfs:path': string
  'obfs:keys': string[]
  'obfs:timestamp': Date | null
  'obfs:exists': boolean

  'obfs:has': (name: string) => boolean

  'obfs:search': (
    query: string,
    options?: OBFS.SearchOptions
  ) => OBFS.SearchResult[]
}

declare namespace OBFS {
  type Encoding =
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'utf-16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex'

  type Permissions =
    | 'r'
    | 'w'
    | 'rw'

  type EncryptionAlgorithm =
    | 'aes256'
    | 'aria256'
    | 'camellia256'

  interface SearchOptions {
    recursive?: boolean
    minScore?: number
    limit?: number
  }

  interface SearchResult {
    path: string
    score: number
  }

  interface EncryptionOptions {
    algorithm: EncryptionAlgorithm
    key?: string
    keyfile?: string
  }

  interface Options {
    path?: string
    name?: string
    encoding?: Encoding
    permissions?: Permissions
    functions?: boolean
    encryption?: EncryptionOptions
  }
}

export = OBFS