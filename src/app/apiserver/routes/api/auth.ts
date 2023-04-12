import Router from 'koa-router';
import { koaBody } from 'koa-body';
import Config from 'app/store/cruds/config.js';
import { ConfigKey } from 'model/resources/enums.js';
import tryRequest from '../../utils/tryRequest.js';

const router = new Router({ prefix: '/auth' });

const Keys = {
  admin: ConfigKey.AdminPass,
  priority: ConfigKey.PriorityPass,
} as const;
type Keys = (typeof Keys)[keyof typeof Keys];

type AuthRequest = {
  name: ConfigKey;
  pass: string;
};

router.post('/', koaBody(), async (ctx, _next) => {
  const param = ctx.request.body as AuthRequest;
  const key = Keys[param.name as keyof typeof Keys];
  await tryRequest(ctx, async () => {
    const pass = await Config.getEntry(Config.identifier(key));
    ctx.body = pass ? pass.value === param.pass : false;
  });
});

export default router;
