import path from 'path';
import Router from 'koa-router';
import koaBody from 'koa-body';
import gridfs from '../../../utils/gridfs-promise.js';
import Job from '../../../apiserver/cruds/job.js';
import { tryRequest } from '../_helper.js';
import { getContentFromRemote, terminateAbaqusJob } from '../../../utils/powershell-remote/commands/index.js';
import NodeModel from '../../../model/node.js';
import { JobStatus } from '../../../model/resources/enums.js';
const router = new Router({ prefix: '/jobs' });
const OutputFileExt = {
    sta: 'sta',
    dat: 'dat',
    log: 'log',
    msg: 'msg',
};
router
    .post('/', koaBody(), async (ctx, _next) => {
    const content = ctx.request.body;
    await tryRequest(ctx, async () => {
        ctx.body = await Job.addEntry(content);
        ctx.status = 201;
    });
})
    .get('/', async (ctx, _next) => {
    const filter = {};
    if (ctx.request.query.name)
        filter.name = ctx.request.query.name;
    if (ctx.request.query.owner)
        filter.owner = ctx.request.query.owner;
    if (ctx.request.query.node)
        filter.node = ctx.request.query.node;
    if (ctx.request.query.cpus)
        filter['command.cpus'] = ctx.request.query.cpus;
    if (ctx.request.query.status)
        filter['status.code'] = ctx.request.query.status;
    await tryRequest(ctx, async () => {
        ctx.body = await Job.getEntrys(filter);
    });
})
    .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const condition = Job.identifier(ctx.params.id);
        ctx.body = await Job.getEntry(condition);
    });
})
    .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const condition = Job.identifier(ctx.params.id);
        // 開始されていたら削除しない
        condition['status.code'] = { $ne: JobStatus.Running };
        const deleted = await Job.deleteEntry(condition);
        if (deleted && deleted.input.uploaded) {
            // delete input file in gridfs
            // console.log(deleted.input.uploaded);
            await gridfs.delete(deleted.input.uploaded);
            ctx.body = deleted;
        }
        else {
            ctx.body = 'The job already deleted or start running.';
            ctx.status = 204;
        }
    });
})
    .get('/:id/sta', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const content = await getJobOutputFile(ctx.params.id, OutputFileExt.sta);
        if (content) {
            ctx.body = content;
        }
        else {
            ctx.status = 204;
        }
    });
})
    .get('/:id/dat', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const content = await getJobOutputFile(ctx.params.id, OutputFileExt.dat);
        if (content) {
            ctx.body = content;
        }
        else {
            ctx.status = 204;
        }
    });
})
    .get('/:id/log', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const content = await getJobOutputFile(ctx.params.id, OutputFileExt.log);
        if (content) {
            ctx.body = content;
        }
        else {
            ctx.status = 204;
        }
    });
})
    .get('/:id/msg', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const content = await getJobOutputFile(ctx.params.id, OutputFileExt.msg);
        if (content) {
            ctx.body = content;
        }
        else {
            ctx.status = 204;
        }
    });
})
    .post('/:id/start', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const condition = Job.identifier(ctx.params.id);
        condition['input.external'] = { $ne: null };
        // Ready なら Running に
        condition['status.code'] = JobStatus.Ready;
        const update = {
            'status.code': JobStatus.Running,
            'status.at': new Date(),
            'status.msg': 'Started by external signal.',
        };
        const job = await Job.updateEntry(condition, update);
        if (job) {
            ctx.body = job;
            ctx.status = 201;
        }
        else {
            ctx.status = 422;
        }
    });
})
    .post('/:id/complete', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const condition = Job.identifier(ctx.params.id);
        condition['input.external'] = { $ne: null };
        // Running なら Completed に
        condition['status.code'] = JobStatus.Completed;
        const update = {
            'status.code': JobStatus.Running,
            'status.at': new Date(),
            'status.msg': 'Completed by external signal.',
        };
        const job = await Job.updateEntry(condition, update);
        if (job) {
            ctx.body = job;
            ctx.status = 201;
        }
        else {
            ctx.status = 422;
        }
    });
})
    .post('/:id/terminate', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const condition = Job.identifier(ctx.params.id);
        const job = await Job.getEntry(condition);
        if (!job) {
            ctx.status = 500;
        }
        else if (job.input.external) {
            const condition = Job.identifier(ctx.params.id);
            condition['input.external'] = { $ne: null };
            const update = {
                'status.code': JobStatus.Missing,
                'status.at': new Date(),
                'status.msg': 'Aborted while executing externally.',
            };
            const job = await Job.updateEntry(condition, update);
            if (job) {
                ctx.body = job;
                ctx.status = 201;
            }
            else {
                ctx.status = 422;
            }
        }
        else {
            const node = (await NodeModel.findOne({ hostname: job.node }))?.toObject(); // TODO
            if (node) {
                const stdout = await terminateAbaqusJob(node, job);
                ctx.body = { accept: /Sent Terminate message to Abaqus job [^ ]* on [^ ]*/.test(stdout) };
                ctx.status = 202;
            }
            else {
                ctx.status = 500;
            }
        }
    });
});
export default router;
async function getJobOutputFile(jobId, ext) {
    const condition = Job.identifier(jobId);
    const job = await Job.getEntry(condition);
    if (!job)
        return null;
    const dir = job.status.resultDirectoryPath || job.status.executeDirectoryPath || null;
    if (!dir)
        return null;
    const node = (await NodeModel.findOne({ hostname: job.node }))?.toObject();
    if (!node)
        return null;
    const filename = `${job.name}.${ext}`;
    const filepath = path.join(dir, filename);
    return getContentFromRemote(node, filepath);
}
