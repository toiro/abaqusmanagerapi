import Router from 'koa-router';
import koaBody from 'koa-body';
import User from '~/models/user.js';

const router = new Router({ prefix: '/users' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const { content } = ctx.request.body;
    ctx.body = await User.addItem({ content });
  })
  .get('/', async(ctx, next) => {
    ctx.body = await User.getItems();
  })
  .get('/:id', async(ctx, next) => {
    ctx.body = await User.getItem(ctx.params.id);
  });

export default router;
