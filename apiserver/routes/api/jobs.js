import path from 'path';
import Router from 'koa-router';
import koaBody from 'koa-body';
import gridfs from '~/utils/gridfs-promise.js';
import Job from '~/apiserver/cruds/job.js';
import { tryRequest } from '../_helper.js';
import getContentFromRemote from '~/utils/powershell-remote/commands/getContentFromRemote.js';
import terminateAbaqusJob from '~/utils/powershell-remote/commands/terminateAbaqusJob.js';
import NodeModel from '~/models/node.js';
import STATUS from '~/models/enums/job-status.js';

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
    const filter = {};
    if (ctx.request.query.owner) filter.owner = ctx.request.query.owner;
    if (ctx.request.query.node) filter.node = ctx.request.query.node;
    if (ctx.request.query.cpus) filter['command.cpus'] = ctx.request.query.cpus;
    if (ctx.request.query.status) filter['status.code'] = ctx.request.query.status;
    await tryRequest(ctx, async() => {
      ctx.body = await Job.getEntrys(filter);
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
      condition['status.code'] = { $ne: STATUS.Running };
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
  })
  .post('/:id/start', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const condition = Job.identifier(ctx.params.id);
      condition['input.external'] = { $ne: null };
      // Ready なら Running に
      condition['status.code'] = STATUS.Ready;
      const update = {};
      update['status.code'] = STATUS.Running;
      update['status.at'] = Date.now();
      update['status.msg'] = 'Started by external signal.';
      const job = await Job.updateEntry(condition, update);

      if (job) {
        ctx.body = job;
        ctx.status = 201;
      } else {
        ctx.status = 422;
      }
    });
  })
  .post('/:id/complete', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const condition = Job.identifier(ctx.params.id);
      condition['input.external'] = { $ne: null };
      // Running なら Completed に
      condition['status.code'] = STATUS.Running;
      const update = {};
      update['status.code'] = STATUS.Completed;
      update['status.at'] = Date.now();
      update['status.msg'] = 'Completed by external signal.';
      const job = await Job.updateEntry(condition, update);

      if (job) {
        ctx.body = job;
        ctx.status = 201;
      } else {
        ctx.status = 422;
      }
    });
  })
  .post('/:id/terminate', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const condition = Job.identifier(ctx.params.id);
      const job = await Job.getEntry(condition);

      if (job.input.external) {
        const condition = Job.identifier(ctx.params.id);
        condition['input.external'] = { $ne: null };
        const update = {};
        update['status.code'] = STATUS.Missing;
        update['status.at'] = Date.now();
        update['status.msg'] = 'Aborted while executing externally.';
        const job = await Job.updateEntry(condition, update);
        if (job) {
          ctx.body = job;
          ctx.status = 201;
        } else {
          ctx.status = 422;
        }
      } else {
        const node = (await NodeModel.findOne({ hostname: job.node })).toObject();

        const stdout = await terminateAbaqusJob(node, job);

        ctx.body = { accept: /Sent Terminate message to Abaqus job [^ ]* on [^ ]*/.test(stdout) };
        ctx.status = 202;
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
