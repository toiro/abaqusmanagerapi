import Router from 'koa-router';
import multer from '@koa/multer';
import gridfs from '../../../utils/gridfs-promise.js';
import { getGridFSStorage } from '../../../utils/connectdb.js';
import { tryRequest } from '../_helper.js';
const upload = multer({
    storage: getGridFSStorage(),
    limits: { fileSize: 1024 * 1024 * 1024 }
}).single('inputfile');
const router = new Router({ prefix: '/inputfiles' });
router
    .post('/', async (ctx, next) => {
    // multer から gridfs-storage を通じて mongoDB にファイルを格納する
    await tryRequest(ctx, async () => {
        await upload(ctx, next); // 内部で next() が呼ばれている
    });
}, (ctx, _next) => {
    // メタデータを返す
    const inputfile = ctx.request.file;
    ctx.body = inputfile;
})
    .get('/meta/:id', async (ctx, _next) => {
    ctx.body = await gridfs.findById(ctx.params.id);
})
    .get('/:id', async (ctx, _next) => {
    ctx.body = await gridfs.openDownloadStream(ctx.params.id);
});
export default router;
