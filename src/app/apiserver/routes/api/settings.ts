import Router from 'koa-router'
import { koaBody } from 'koa-body'
import Setting from 'app/store/cruds/setting.js'
import { ISetting } from 'sharedDefinitions/model/setting.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

router
  .get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Setting.getEntrys()
    })
  })
  .get('/applying', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const array = await Setting.getEntrys({ onApplying: true })
      if (array && array.length === 1) {
        ;[ctx.body] = array
      } else {
        throw new Error(`${array.length} settings are found. Only 1 must be found.`)
      }
    })
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Setting.getEntry(Setting.identifier(ctx.params.id as string))
    })
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as ISetting
    await tryRequest(ctx, async () => {
      ctx.body = await Setting.updateEntry(Setting.identifier(ctx.params.id as string), param)
    })
  })

export default router
