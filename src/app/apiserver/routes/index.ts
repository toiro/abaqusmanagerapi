import path from 'path'
import importDir from 'utils/import-fromdir.js'
import Router from 'koa-router'
import MetaHandler from 'utils/MetaHandler.js'

const router = new Router({ prefix: '/v1/api' })

interface RouterModule {
  default: Router<any, {}>
}

const scriptDir = new MetaHandler(import.meta).ParsedPath.dir
const apiDir = path.join(scriptDir, 'api')
;(async () => {
  ;(await importDir(apiDir)).forEach((module) => {
    const apiRouter = (module as RouterModule).default
    router.use(apiRouter.routes(), apiRouter.allowedMethods())
  })
})().catch((e) => {
  // critical
  throw e
})

export default router
