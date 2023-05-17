import Router from 'koa-router'
import { koaBody } from 'koa-body'
import Auth from 'app/store/cruds/auth.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

export const SystemAuthKeys = {
  admin: '__AdminPass__',
  priority: '__PriorityPass__',
} as const
export type SystemAuthKeys = (typeof SystemAuthKeys)[keyof typeof SystemAuthKeys]

type AuthRequest = {
  name: SystemAuthKeys
  pass: string
}

router.post('/', koaBody(), async (ctx, _next) => {
  const param = ctx.request.body as AuthRequest
  const key: SystemAuthKeys | undefined = SystemAuthKeys[param.name as keyof typeof SystemAuthKeys]
  if (!key) {
    ctx.body = false
  } else {
    await tryRequest(ctx, async () => {
      const pass = await Auth.getEntry(Auth.identifier(key))
      ctx.body = pass?.code === param.pass
    })
  }
})

export default router
