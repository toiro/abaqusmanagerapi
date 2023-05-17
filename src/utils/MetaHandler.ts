import url from 'node:url'
import path from 'node:path'

export default class MetaHandler {
  readonly meta

  readonly fullpath

  readonly ParsedPath: Readonly<path.ParsedPath>

  constructor(meta: ImportMeta) {
    this.meta = meta
    this.fullpath = url.fileURLToPath(this.meta.url)
    this.ParsedPath = path.parse(this.fullpath)
  }
}
