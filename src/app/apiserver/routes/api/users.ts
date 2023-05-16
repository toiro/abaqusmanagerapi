import Router from 'koa-router'
import { koaBody } from 'koa-body'
import User from 'app/store/cruds/user.js'
import type { IUser } from 'sharedDefinitions/model/user.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

router
  .post('/', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as IUser
    await tryRequest(ctx, async () => {
      ctx.body = await User.addEntry(param)
      ctx.status = 201
    })
  })
  .get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await User.getEntrys()
    })
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await User.getEntry(User.identifier(ctx.params.id as string))
    })
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as IUser
    await tryRequest(ctx, async () => {
      ctx.body = await User.updateEntry(User.identifier(ctx.params.id as string), param)
    })
  })
  .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await User.deleteEntry(User.identifier(ctx.params.id as string))
    })
  })

export default router
