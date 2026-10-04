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
  interface SearchOptions {
    recursive?: boolean
    minScore?: number
    limit?: number
  }

  interface SearchResult {
    path: string
    score: number
  }

  interface Options {
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
}

export = OBFS