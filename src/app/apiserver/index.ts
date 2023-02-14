import config from 'config';
import Koa from 'koa';
import responseTime from 'koa-response-time';
import compress from 'koa-compress';
import koalogger from 'koa-logger-winston';
import { logger } from 'utils/logger.js';
import router from './routes/index.js';

export default (_opts?: { [key: string]: any }) => {
  // opts = opts || {};
  const app = new Koa();

  if (config.get('env') !== 'test') {
    app.use(koalogger(logger));
  }
  app.on('error', (err, ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.error(String(ctx.body), err);
  });

  app
    .use(responseTime())
    .use(compress());

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app;
};
