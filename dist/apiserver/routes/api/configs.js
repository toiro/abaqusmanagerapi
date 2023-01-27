import Router from 'koa-router';
import koaBody from 'koa-body';
import Config from '../../../apiserver/cruds/config.js';
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
        ctx.body = await Config.getEntry(Config.identifier(ctx.params.id));
    });
})
    .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async () => {
        ctx.body = await Config.updateEntry(Config.identifier(ctx.params.id), param);
    });
});
export default router;
