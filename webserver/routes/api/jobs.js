import Router from 'koa-router';
import koaBody from 'koa-body';
import Job from '~/models/job.js';

const router = new Router({ prefix: '/jobs' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const { content } = ctx.request.body;
    ctx.body = await Job.createItem({ content });
  })
  .get('/', async(ctx, next) => {
    ctx.body = await Job.getItems();
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
