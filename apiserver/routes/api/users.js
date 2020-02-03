import Router from 'koa-router';
import koaBody from 'koa-body';
import User from '~/models/user.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/users' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async() => {
      ctx.body = await User.addEntry(param);
      ctx.status = 201;
    });
  })
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await User.getEntrys();
    });
  })
  .get('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      console.log(User.identifier);
      ctx.body = await User.getEntry(User.identifier(ctx.params.id));
    });
  })
  .delete('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await User.deleteEntry(User.identifier(ctx.params.id));
    });
  });

export default router;
