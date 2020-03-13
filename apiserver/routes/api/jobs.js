import path from 'path';
import Router from 'koa-router';
import koaBody from 'koa-body';
import gridfs from '~/utils/gridfs-promise.js';
import Job from '~/apiserver/cruds/job.js';
import { tryRequest } from '../_helper.js';
import getContentFromRemote from '~/utils/powershell-remote/commands/getContentFromRemote.js';
import NodeModel from '~/models/node.js';

const router = new Router({ prefix: '/jobs' });

router
  .post('/', koaBody(), async(ctx, next) => {
    const content = ctx.request.body;
    await tryRequest(ctx, async() => {
      ctx.body = await Job.addEntry(content);
      ctx.status = 201;
    });
  })
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = await Job.getEntrys();
    });
  })
  .get('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const condition = Job.identifier(ctx.params.id);
      ctx.body = await Job.getEntry(condition);
    });
  })
  .delete('/:id', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const condition = Job.identifier(ctx.params.id);
      // 開始されていたら削除しない
      condition['status.code'] = { $ne: 'Running' };
      const deleted = await Job.deleteEntry(condition);
      if (deleted && deleted.input.uploaded) {
        // delete input file in gridfs
        console.log(deleted.input.uploaded);
        await gridfs.delete(deleted.input.uploaded);
        ctx.body = deleted;
      } else {
        ctx.body = 'The job already deleted or start running.';
        ctx.status = 204;
      }
    });
  })
  .get('/:id/sta', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const content = await getJobOutputFile(ctx.params.id, 'sta');
      if (content) {
        ctx.body = content;
      } else {
        ctx.status = 204;
      }
    });
  })
  .get('/:id/dat', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const content = await getJobOutputFile(ctx.params.id, 'dat');
      if (content) {
        ctx.body = content;
      } else {
        ctx.status = 204;
      }
    });
  })
  .get('/:id/log', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const content = await getJobOutputFile(ctx.params.id, 'log');
      if (content) {
        ctx.body = content;
      } else {
        ctx.status = 204;
      }
    });
  })
  .get('/:id/msg', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const content = await getJobOutputFile(ctx.params.id, 'msg');
      if (content) {
        ctx.body = content;
      } else {
        ctx.status = 204;
      }
    });
  });

export default router;

async function getJobOutputFile(jobId, ext) {
  const condition = Job.identifier(jobId);
  const job = await Job.getEntry(condition);

  const dir = job.status.resultDirectoryPath || job.status.executeDirectoryPath || null;
  if (!dir) return null;

  const filename = `${job.name}.${ext}`;
  const node = (await NodeModel.findOne({ hostname: job.node })).toObject();
  const filepath = path.join(dir, filename);
  return getContentFromRemote(node, filepath);
}
