import path from 'path'
import Router from 'koa-router'
import { koaBody } from 'koa-body'
import gridfs from 'app/store/gridfs-promise.js'
import Job from 'app/store/cruds/job.js'
import { getContentFromRemote, terminateAbaqusJob } from 'app/junction/powershell-remote/commands/index.js'
// import NodeModel from 'sharedDefinitions/model/node.js';
import { getNode } from 'app/junction/queries.js'
import { JobStatus } from 'sharedDefinitions/model/resources/enums.js'
import type { IJob } from 'sharedDefinitions/model/job.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

type GetQuery = {
  name?: string
  owner?: string
  node?: string
  'command.cpus'?: string
  'status.code'?: JobStatus
}
type UpdateStatusContent = {
  'status.code': JobStatus
  'status.at': Date
  'status.msg': string
}

const OutputFileExt = {
  sta: 'sta',
  dat: 'dat',
  log: 'log',
  msg: 'msg',
} as const
type OutputFileExt = (typeof OutputFileExt)[keyof typeof OutputFileExt]

async function getJobOutputFile(jobId: string, ext: OutputFileExt) {
  const condition = Job.identifier(jobId)

  const job = await Job.getEntry(condition)
  if (!job) return null

  const dir = job.status.resultDirectoryPath || job.status.executeDirectoryPath || null
  if (!dir) return null

  const node = await getNode(job.node)
  if (!node) return null

  const filename = `${job.name}.${ext}`
  const filepath = path.join(dir, filename)
  return getContentFromRemote(node, filepath)
}

router
  .post('/', koaBody(), async (ctx, _next) => {
    const content: IJob = ctx.request.body as IJob
    await tryRequest(ctx, async () => {
      ctx.body = await Job.addEntry(content)
      ctx.status = 201
    })
  })
  .get('/', async (ctx, _next) => {
    const filter: GetQuery = {}
    if (ctx.request.query.name) filter.name = ctx.request.query.name as string
    if (ctx.request.query.owner) filter.owner = ctx.request.query.owner as string
    if (ctx.request.query.node) filter.node = ctx.request.query.node as string
    if (ctx.request.query.cpus) filter['command.cpus'] = ctx.request.query.cpus as string
    if (ctx.request.query.status) filter['status.code'] = ctx.request.query.status as JobStatus
    await tryRequest(ctx, async () => {
      ctx.body = await Job.getEntrys(filter)
    })
  })
  .get('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const condition = Job.identifier(ctx.params.id as string)
      ctx.body = await Job.getEntry(condition)
    })
  })
  .delete('/:id', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const condition = Job.identifier(ctx.params.id as string)
      // 開始されていたら削除しない
      condition['status.code'] = { $nin: [JobStatus.Running, JobStatus.Starting] }
      const deleted = await Job.deleteEntry(condition)
      if (deleted && deleted.input.type === 'upload') {
        // delete input file in gridfs
        // console.log(deleted.input.uploaded);
        await gridfs.delete(deleted.input.uploaded)
        ctx.body = deleted
      } else {
        ctx.body = 'The job already deleted or start running.'
        ctx.status = 204
      }
    })
  })
  .get('/:id/sta', async (ctx, _next) => {
    // TODO '/:id/:ext'
    await tryRequest(ctx, async () => {
      const content = await getJobOutputFile(ctx.params.id as string, OutputFileExt.sta)
      if (content) {
        ctx.body = content
      } else {
        ctx.status = 204
      }
    })
  })
  .get('/:id/dat', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const content = await getJobOutputFile(ctx.params.id as string, OutputFileExt.dat)
      if (content) {
        ctx.body = content
      } else {
        ctx.status = 204
      }
    })
  })
  .get('/:id/log', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const content = await getJobOutputFile(ctx.params.id as string, OutputFileExt.log)
      if (content) {
        ctx.body = content
      } else {
        ctx.status = 204
      }
    })
  })
  .get('/:id/msg', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const content = await getJobOutputFile(ctx.params.id as string, OutputFileExt.msg)
      if (content) {
        ctx.body = content
      } else {
        ctx.status = 204
      }
    })
  })
  .post('/:id/start', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const condition = Job.identifier(ctx.params.id as string)
      condition['input.external'] = { $ne: null }
      // Ready なら Running に
      condition['status.code'] = JobStatus.Ready
      const update: UpdateStatusContent = {
        'status.code': JobStatus.Running,
        'status.at': new Date(),
        'status.msg': 'Started by external signal.',
      }
      const job = await Job.updateEntry(condition, update)

      if (job) {
        ctx.body = job
        ctx.status = 201
      } else {
        ctx.status = 422
      }
    })
  })
  .post('/:id/complete', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const condition = Job.identifier(ctx.params.id as string)
      condition['input.external'] = { $ne: null }
      // Running なら Completed に
      condition['status.code'] = JobStatus.Running
      const update: UpdateStatusContent = {
        'status.code': JobStatus.Completed,
        'status.at': new Date(),
        'status.msg': 'Completed by external signal.',
      }
      const job = await Job.updateEntry(condition, update)

      if (job) {
        ctx.body = job
        ctx.status = 201
      } else {
        ctx.status = 422
      }
    })
  })
  .post('/:id/terminate', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
      const condition = Job.identifier(ctx.params.id as string)
      const job = await Job.getEntry(condition)
      if (!job) {
        ctx.status = 500
      } else if (job.input.type === 'external') {
        condition['input.type'] = 'external' // TODO test
        const update: UpdateStatusContent = {
          'status.code': JobStatus.Missing,
          'status.at': new Date(),
          'status.msg': 'Aborted while executing externally.',
        }
        const jobAfterUpdate = await Job.updateEntry(condition, update)
        if (jobAfterUpdate) {
          ctx.body = jobAfterUpdate
          ctx.status = 201
        } else {
          ctx.status = 422
        }
      } else {
        const node = await getNode(job.node)
        if (node) {
          const stdout = await terminateAbaqusJob(node, job)

          ctx.body = { accept: /Sent Terminate message to Abaqus job [^ ]* on [^ ]*/.test(stdout) }
          ctx.status = 202
        } else {
          ctx.status = 500
        }
      }
    })
  })

export default router
