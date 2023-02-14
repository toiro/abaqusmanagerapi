import path from 'path';
import importDir from 'utils/import-fromdir.js';
import scriptDir from 'utils/scriptdir.js';
import Router from 'koa-router';

const router = new Router({ prefix: '/v1/api' });

interface RouterModule {
  default: Router<any, {}>;
}

const apiDir = path.join(scriptDir(import.meta), 'api');
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  (await importDir(apiDir)).forEach((module) => {
    const apiRouter = (module as RouterModule).default;
    router.use(apiRouter.routes(), apiRouter.allowedMethods());
  });
})();

export default router;
