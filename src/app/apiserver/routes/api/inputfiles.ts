import Router from 'koa-router';
import multer, { StorageEngine } from '@koa/multer';
import gridfs from 'app/store/gridfs-promise.js';
import type { DefaultContext, ParameterizedContext } from 'koa';
import { getGridFSStorage } from 'app/store/connectdb.js';
import tryRequest from '../../helpers/tryRequest.js';

const upload = multer({
  storage: getGridFSStorage() as StorageEngine,
  limits: { fileSize: 1024 * 1024 * 1024 },
}).single('inputfile');

const router = new Router({ prefix: '/inputfiles' });

router
  .post(
    '/',
    async (ctx, next) => {
      // multer から gridfs-storage を通じて mongoDB にファイルを格納する
      await tryRequest(ctx, async () => {
        await upload(ctx as unknown as ParameterizedContext<any, DefaultContext, any>, next); // 内部で next() が呼ばれている
      });
    },
    (ctx, _next) => {
      // メタデータを返す
      const inputfile = ctx.request.file;
      ctx.body = inputfile;
    }
  )
  .get('/meta/:id', async (ctx, _next) => {
    ctx.body = await gridfs.findById(ctx.params.id as string);
  })
  .get('/:id', async (ctx, _next) => {
    ctx.body = await gridfs.openDownloadStream(ctx.params.id as string);
  });

export default router;
