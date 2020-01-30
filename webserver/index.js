import config from 'config';
import Koa from 'koa';
import responseTime from 'koa-response-time';
import compress from 'koa-compress';
import koalogger from 'koa-logger-winston';
import logger from '~/utils/logger.js';
import router from './routes/api/index.js';

export default opts => {
  opts = opts || {};
  const app = new Koa();

  if ('test' != config.get('env')) app.use(koalogger(logger));

  app
    .use(responseTime())
    .use(compress());

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app;
};
