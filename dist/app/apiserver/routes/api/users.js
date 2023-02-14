import Router from 'koa-router';
import koaBody from 'koa-body';
import User from '../../../../app/store/cruds/user.js';
import { tryRequest } from '../_helper.js';
const router = new Router({ prefix: '/users' });
router
    .post('/', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async () => {
        ctx.body = await User.addEntry(param);
        ctx.status = 201;
    });
})
    .get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        ctx.body = await User.getEntrys();
    });
})
    .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        ctx.body = await User.getEntry(User.identifier(ctx.params.id));
    });
})
    .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async () => {
        ctx.body = await User.updateEntry(User.identifier(ctx.params.id), param);
    });
})
    .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        ctx.body = await User.deleteEntry(User.identifier(ctx.params.id));
    });
});
export default router;
