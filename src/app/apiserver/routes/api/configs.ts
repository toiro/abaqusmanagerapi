import Router from 'koa-router';
import koaBody from 'koa-body';
import Config from 'app/store/cruds/config.js';
import type { IConfig } from 'model/config.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/configs' });

router
  .get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Config.getEntrys();
    });
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Config.getEntry(Config.identifier(ctx.params.id as string));
    });
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as IConfig;
    await tryRequest(ctx, async () => {
      ctx.body = await Config.updateEntry(Config.identifier(ctx.params.id as string), param);
    });
  });

export default router;
