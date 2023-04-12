import Router from 'koa-router';
import koaBody from 'koa-body';
import Node from 'app/store/cruds/node.js';
import type { INode } from 'model/node.js';
import tryRequest from '../../helpers/tryRequest.js';

const router = new Router({ prefix: '/nodes' });

router
  .post('/', koaBody(), async (ctx, _next) => {
    const content = ctx.request.body as INode;
    await tryRequest(ctx, async () => {
      ctx.body = await Node.addEntry(content);
      ctx.status = 201;
    });
  })
  .get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Node.getEntrys();
    });
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Node.getEntry(Node.identifier(ctx.params.id as string));
    });
  })
  .post('/:id', koaBody(), async (ctx, _next) => {
    const param = ctx.request.body as INode;
    await tryRequest(ctx, async () => {
      ctx.body = await Node.updateEntry(Node.identifier(ctx.params.id as string), param);
    });
  })
  .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      ctx.body = await Node.deleteEntry(Node.identifier(ctx.params.id as string));
    });
  });

export default router;
