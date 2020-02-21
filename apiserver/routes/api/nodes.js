import Router from 'koa-router';
import koaBody from 'koa-body';
import Node from '~/apiserver/cruds/node.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/nodes' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const content = ctx.request.body;
    await tryRequest(ctx, async() => {
      ctx.body = await Node.addEntry(content);
      ctx.status = 201;
    });
  })
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await Node.getEntrys();
    });
  })
  .get('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await Node.getEntry(Node.identifier(ctx.params.id));
    });
  })
  .post('/:id', koaBody(), async(ctx, next) => {
    const param = ctx.request.body;
    await tryRequest(ctx, async() => {
      ctx.body = await Node.updateEntry(Node.identifier(ctx.params.id), param);
    });
  })
  .delete('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const param = ctx.request.body;
      ctx.body = await Node.deleteEntry(Node.identifier(ctx.params.id), param);
    });
  });

export default router;
