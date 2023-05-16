import Router from 'koa-router'
import { koaBody } from 'koa-body'
import Node from 'app/store/cruds/node.js'
import type { INode } from 'sharedDefinitions/model/node.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

router
  .post('/', koaBody(), async (ctx, _next) => {
    const content = ctx.request.body as INode
    await tryRequest(ctx, async () => {
      ctx.body = await Node.addEntry(content)
      ctx.status = 201
    })
  })
  .get('/', async (ctx, _next) => {
    const { includeNonactive } = ctx.request.query
    // Return nodes only which has true isActive unless includeNonactive is '1'
    const filter = includeNonactive === '1' ? {} : { isActive: true }
    await tryRequest(ctx, async () => {
      ctx.body = await Node.getEntrys(filter)
    })
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Node.getEntry(Node.identifier(ctx.params.id as string))
    })
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as INode
    await tryRequest(ctx, async () => {
      ctx.body = await Node.updateEntry(Node.identifier(ctx.params.id as string), param)
    })
  })
  .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Node.deleteEntry(Node.identifier(ctx.params.id as string))
    })
  })

export default router
