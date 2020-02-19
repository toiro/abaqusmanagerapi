import Router from 'koa-router';
import userRouter from './api/users.js';
import jobRouter from './api/jobs.js';
import authRouter from './api/auth.js';
import inputfileRouter from './api/inputfiles.js';

const router = new Router({ prefix: '/v1/api' });

router
  .use(userRouter.routes(), userRouter.allowedMethods())
  .use(jobRouter.routes(), jobRouter.allowedMethods())
  .use(authRouter.routes(), authRouter.allowedMethods())
  .use(inputfileRouter.routes(), inputfileRouter.allowedMethods());

export default router;
