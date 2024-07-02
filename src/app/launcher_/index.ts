import schedule from 'node-cron'
import { logger } from 'utils/logger.js'
import { jobsOn } from 'app/junction/queries.js'
import { JobStatus } from 'sharedDefinitions/model/resources/enums.js'
import jobStatusReciever from 'app/junction/JobStatusRecieverSingleton.js'
import type { IJob } from 'sharedDefinitions/model/job.js'
import pickTasks from './pickTasks.js'
import SerialPrepareThenPararelExecuteTaskLauncher, { LaunchEventName } from './SerialPrepareThenPararelExecuteTaskLauncher.js'
import AbaqusTask from './task/AbaqusTask.js'
import JobDisposer, { DisposeEventName } from './JobDisporser.js'
import {
  AbsSerialPrepareThenPararelExecuteTask,
  ExecuteContext,
  ExecuteResult,
} from './task/AbsSerialPrepareThenPararelExecuteTask.js'

async function scanMissingJobs() {
  const starting = await jobsOn(JobStatus.Starting)
  const ready = await jobsOn(JobStatus.Ready)
  const running = await jobsOn(JobStatus.Running)

  const toBeMissing = starting.concat(ready).concat(running)
  toBeMissing.forEach((job) => {
    jobStatusReciever.missing(
      job,
      'The status is missed because Abaqus Manager was maybe halted while the job was running or starting.'
    )
  })
}

export default async () => {
  // 起動時に Starting / Ready / Running は Missing に
  await scanMissingJobs()

  const launcher = new SerialPrepareThenPararelExecuteTaskLauncher()
    .on(LaunchEventName.ERROR, (task: AbsSerialPrepareThenPararelExecuteTask, error: Error) => {
      const { job } = task
      logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error)
      jobStatusReciever.failed(job, error.message)
    })
    .on(LaunchEventName.LAUNCH, (task: AbsSerialPrepareThenPararelExecuteTask, context: ExecuteContext) => {
      const { job } = task
      logger.info(`Launch ${job.owner}'s job: ${job.name}`)
      jobStatusReciever.running(job, context.executionDirPath)
    })
    .on(LaunchEventName.FINISH, (task: AbsSerialPrepareThenPararelExecuteTask, result: ExecuteResult) => {
      const { job } = task
      // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは 0
      // 逆に解析が正しく終了しても終了コードが 0 ではない場合がある
      // なので最終標準出力の内容で完了したかどうかを判定する
      if (result.msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`)
        jobStatusReciever.completed(job, result.msg, result.resultDir)
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}: ${result.msg}`)
        jobStatusReciever.failed(job, result.msg, result.resultDir)
      }
    })

  launcher.on(LaunchEventName.QUEUE, (task: AbaqusTask, count: number) => {
    const { job } = task
    logger.verbose(`Queue ${job.owner}'s job: ${job.name} on ${count}th`)
  })
  launcher.on(LaunchEventName.DEPLOY, (task: AbaqusTask) => {
    const { job } = task
    logger.verbose(`Deploy ${job.owner}'s job: ${job.name}`)
  })

  const disposer = new JobDisposer()
  disposer.on(DisposeEventName.MARK, (job: IJob) => {
    logger.verbose(`Mark to dispose ${job.owner}'s job: ${job.name}`)
  })
  disposer.on(DisposeEventName.DELETE, (job: IJob) => {
    logger.verbose(`Delete ${job.owner}'s job automatically: ${job.name}`)
  })

  // 10秒間隔で実行
  const scheduler = schedule.schedule(
    '*/10 * * * * *',
    async () => {
      try {
        const tasks = await pickTasks()
        tasks.forEach((task) => {
          const { job } = task
          logger.verbose(`Pick ${job.owner}'s job: ${job.name}`)

          if (job.input.type === 'external') {
            jobStatusReciever.ready(job)
            // Ready で放置されたものは Missing として後続を実行する
            let timeout = job.input.readyTimeout * 60 * 1000
            if (timeout < 0) {
              timeout = 1000
            }
            setTimeout(() => {
              jobStatusReciever.readyToMissing(job)
            }, timeout)
          } else {
            jobStatusReciever.starting(job)
            // 非同期に実行
            launcher.launch(task)
          }
        })

        await disposer.dispose()
        await disposer.mark()
        // checkJobStatus() // TODO ジョブの追跡に失敗していないかを検証する
      } catch (error) {
        logger.error(error)
      }
    },
    {
      scheduled: false,
      timezone: 'Asia/Tokyo',
    }
  )

  return scheduler
}
