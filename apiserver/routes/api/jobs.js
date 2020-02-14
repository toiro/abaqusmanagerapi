import Router from 'koa-router';
import koaBody from 'koa-body';
import Job from '~/apiserver/cruds/job.js';

const router = new Router({ prefix: '/jobs' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const { content } = ctx.request.body;
    ctx.body = await Job.createItem({ content });
  })
  .get('/', async(ctx, next) => {
    ctx.body = await Job.getItems();
  })
  .post('/import', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  })
  .get('/:id', async(ctx, next) => {
    ctx.body = await Job.getItem(ctx.params.id);
  })
  .get('/:id/sta', async(ctx, next) => {
    ctx.body = await Job.getItem(ctx.params.id);
  })
  .get('/:id/dat', async(ctx, next) => {
    ctx.body = await Job.getItem(ctx.params.id);
  })
  .get('/:id/log', async(ctx, next) => {
    ctx.body = await Job.getItem(ctx.params.id);
  })
  .get('/:id/msg', async(ctx, next) => {
    ctx.body = await Job.getItem(ctx.params.id);
  });

export default router;
