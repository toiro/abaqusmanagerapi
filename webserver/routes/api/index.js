import Router from 'koa-router';
import userRouter from './users.js';
import jobRouter from './jobs.js';

const router = new Router({ prefix: '/v1/api' });
router
  .use(userRouter.routes(), userRouter.allowedMethods())
  .use(jobRouter.routes(), jobRouter.allowedMethods());

export default router;
