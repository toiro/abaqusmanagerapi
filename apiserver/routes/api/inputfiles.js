import Router from 'koa-router';
import multer from '@koa/multer';
import GridFsStorage from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import { tryRequest } from '../_helper.js';

const storage = new GridFsStorage({
  db: mongoose.connection,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'inputfiles'
    };
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }
}).single('inputfile');

const router = new Router({ prefix: '/inputfiles' });

router
  .get('/', async(ctx, next) => {
    ctx.body = 'inputfile get list';
  })
  .post('/',
    async(ctx, next) => {
      // multer から gridfs-storage を通じて mongoDB にファイルを格納する
      await tryRequest(ctx, async() => {
        await upload(ctx, next); // 内部で next() が呼ばれている
      });
    },
    async(ctx, next) => {
      // メタデータを返す
      const inputfile = ctx.request.file;
      ctx.body = inputfile;
    });

export default router;
