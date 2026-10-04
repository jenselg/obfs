export interface OBFSSearchOptions {
  recursive?: boolean
  minScore?: number
  limit?: number
}

export interface OBFSSearchResult {
  path: string
  score: number
}

export interface OBFSOptions {
  path?: string
  name?: string
  encoding?: BufferEncoding
  permissions?: 'r' | 'w' | 'rw'
  functions?: boolean

  encryption?: {
    algorithm: 'aes256' | 'aria256' | 'camellia256'
    key?: string
    keyfile?: string
  }
}

export interface OBFSNode {
  [key: string]: any

  'obfs:name': string
  'obfs:path': string
  'obfs:keys': string[]
  'obfs:timestamp': Date | null

  'obfs:exists': boolean
  'obfs:has': (name: string) => boolean

  'obfs:search': (
    query: string,
    options?: OBFSSearchOptions
  ) => OBFSSearchResult[]
}

declare class OBFS {
  constructor(options?: OBFSOptions)

  [key: string]: any
}

export = OBFS