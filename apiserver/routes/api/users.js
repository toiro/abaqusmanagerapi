import Router from 'koa-router';
import koaBody from 'koa-body';
import User from '~/models/user.js';
import { tryRequest } from './_helper.js';

const router = new Router({ prefix: '/users' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async() => {
      ctx.body = await User.addItem(param.name);
      ctx.status = 201;
    });
  })
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await User.getItems();
    });
  })
  .get('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await User.getItem(ctx.params.id);
    });
  })
  .delete('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await User.deleteItem(ctx.params.id);
    });
  });

export default router;
