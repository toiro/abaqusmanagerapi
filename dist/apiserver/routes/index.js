import path from 'path';
import importDir from '../../utils/import-fromdir.js';
import scriptDir from '../../utils/scriptdir.js';
import Router from 'koa-router';
const router = new Router({ prefix: '/v1/api' });
const apiDir = path.join(scriptDir(import.meta), 'api');
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
    (await importDir(apiDir)).forEach((module) => {
        const apiRouter = module.default;
        router.use(apiRouter.routes(), apiRouter.allowedMethods());
    });
})();
export default router;
