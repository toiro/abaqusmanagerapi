import Router from 'koa-router';
import koaBody from 'koa-body';
import User from 'app/store/cruds/user.js';
import type { IUser } from 'model/user.js';
import tryRequest from '../../helpers/tryRequest.js';

const router = new Router({ prefix: '/users' });

router
  .post('/', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as IUser;
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
      ctx.body = await User.getEntry(User.identifier(ctx.params.id as string));
    });
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as IUser;
    await tryRequest(ctx, async () => {
      ctx.body = await User.updateEntry(User.identifier(ctx.params.id as string), param);
    });
  })
  .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await User.deleteEntry(User.identifier(ctx.params.id as string));
    });
  });

export default router;
