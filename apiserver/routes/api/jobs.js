import Router from 'koa-router';
import koaBody from 'koa-body';
import Job from '~/apiserver/cruds/job.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/jobs' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const content = ctx.request.body;
    console.log(content);
    await tryRequest(ctx, async() => {
      ctx.body = await Job.addEntry(content);
      ctx.status = 201;
    });
  })
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await Job.getEntrys();
    });
  })
  .post('/import', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  })
  .get('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await Job.getEntry(ctx.params.id);
    });
  })
  .get('/:id/sta', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  })
  .get('/:id/dat', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  })
  .get('/:id/log', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  })
  .get('/:id/msg', async(ctx, next) => {
    throw Error('not implemented yet');// TODO
  });

export default router;
