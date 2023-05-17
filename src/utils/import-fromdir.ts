import fs from 'fs'
import path from 'path'
import { logger } from 'utils/logger.js'
import MetaHandler from './MetaHandler.js'

const meta = new MetaHandler(import.meta)

export default async (dirPath: string): Promise<unknown[]> => {
  const modules = await Promise.all(
    (
      await fs.promises.readdir(dirPath, { withFileTypes: true })
    )
      .filter((dirent) => dirent.isFile())
      .map(async (dirent) => {
        // パス区切り文字が \ だと URL として不正
        const modulePath = path.join(path.relative(meta.ParsedPath.dir, dirPath), dirent.name).replace('\\', '/')
        try {
          logger.verbose(`Import dinamically from ${modulePath}`)
          return (await import(modulePath)) as unknown
        } catch (error) {
          logger.error(`Failed to import dinamically from ${modulePath}. `, error)
          return undefined
        }
      })
  )
  return modules
}
