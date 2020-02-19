import Router from 'koa-router';
import multer from '@koa/multer';
import { tryRequest } from '../_helper.js';
import InputFileModel from '~/models/inputfile.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
}).single('inputfile');

const router = new Router({ prefix: '/inputfiles' });

router
  .get('/', async(ctx, next) => {
    ctx.body = 'inputfile get list';
  })
  .post('/', upload, async(ctx, next) => {
    const inputfile = ctx.request.file;

    await tryRequest(ctx, async() => {
      const fileName = inputfile.originalname;
      const content = inputfile.buffer;

      const upload = new InputFileModel({ fileName, content });
      await upload.save();
      ctx.body = upload._id;
    });
  });

export default router;
