import Router from 'koa-router';
import koaBody from 'koa-body';
import Config from 'app/store/cruds/config.js';
import { ConfigKey } from 'model/resources/enums.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/auth' });

const keys = {
  admin: ConfigKey.AdminPass,
  priority: ConfigKey.PriorityPass,
} as const;

type AuthRequest = {
  name: ConfigKey;
  pass: string;
};

router.post('/', koaBody(), async (ctx, _next) => {
  const param = ctx.request.body as AuthRequest;
  const key = keys[param.name as keyof typeof keys]; // TODO
  await tryRequest(ctx, async () => {
    const pass = await Config.getEntry(Config.identifier(key));
    ctx.body = pass ? pass.value === param.pass : false;
  });
});

export default router;
