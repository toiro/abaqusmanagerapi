import Router from 'koa-router';
import koaBody from 'koa-body';
import Config from '~/apiserver/cruds/config.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/auth' });

const keys = {
  admin: 'adminpass'
};

router
  .post('/', koaBody(), async(ctx, next) => {
    const param = ctx.request.body;
    const key = keys[param.name];
    await tryRequest(ctx, async() => {
      const pass = await Config.getEntry(Config.identifier(key));
      ctx.body = pass ? (pass.value === param.pass) : false;
    });
  });

export default router;
