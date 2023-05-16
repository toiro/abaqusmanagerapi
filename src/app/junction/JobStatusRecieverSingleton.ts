import { EventEmitter } from 'events'
import JobModel from 'app/store/model/job.js'
import { JobStatus } from 'sharedDefinitions/model/resources/enums.js'
import type { IJob } from 'sharedDefinitions/model/job.js'
import { logger } from 'utils/logger.js'

const Event = {
  Update: 'update',
  Transit: 'transit',
} as const
type Event = (typeof Event)[keyof typeof Event]

export type JobStatusUpdateOption = {
  message?: string
  executeDirectoryPath?: string
  resultDirectoryPath?: string
}

type JobStatusTransitOption = {
  message?: string
}

class JobStatusReciever extends EventEmitter {
  constructor() {
    super()
    this.on(Event.Update, async (job: IJob, status: JobStatus, option: JobStatusUpdateOption = {}) => {
      const doc = await JobModel.findById(job._id)
      if (!doc) throw Error(`Job is not found for id ${job._id.toString()}`)
      const oldStatus = doc.status.code
      doc.status = {
        code: status,
        message: option.message ?? doc.status.message ?? '',
        executeDirectoryPath: option.executeDirectoryPath ?? doc.status.executeDirectoryPath ?? '',
        resultDirectoryPath: option.resultDirectoryPath ?? doc.status.resultDirectoryPath ?? '',
        at: new Date(),
      }
      await doc.save()
      logger.verbose(`${job._id.toString()}: ${oldStatus} => ${status}`)
    })
    // 前提ステータスの時だけ、ステータスを変更する
    this.on(
      Event.Transit,
      async (job: IJob, fromStatus: JobStatus, toStatus: JobStatus, option: JobStatusTransitOption = {}) => {
        const filter = {
          _id: job._id,
          'status.code': fromStatus,
        }
        const update = {
          'status.code': toStatus,
          'status.at': new Date(),
          'status.message': option.message ? option.message : undefined,
        }
        await JobModel.findOneAndUpdate(filter, update)
        logger.verbose(`${job._id.toString()}: ${fromStatus} => ${toStatus}`)
      }
    )
  }

  waiting(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Waiting)
  }

  starting(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Starting)
  }

  ready(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Ready)
  }

  running(job: IJob, executeDirectoryPath: string) {
    this.emit(Event.Update, job, JobStatus.Running, { executeDirectoryPath })
  }

  completed(job: IJob, message: string, resultDirectoryPath: string) {
    this.emit(Event.Update, job, JobStatus.Completed, { message, resultDirectoryPath })
  }

  failed(job: IJob, message: string, resultDirectoryPath?: string) {
    this.emit(Event.Update, job, JobStatus.Failed, { message, resultDirectoryPath })
  }

  missing(job: IJob, message: string) {
    this.emit(Event.Update, job, JobStatus.Missing, { message })
  }

  dispose(job: IJob, message: string) {
    this.emit(Event.Update, job, JobStatus.Disposed, { message })
  }

  readyToMissing(job: IJob) {
    this.emit(Event.Transit, job, JobStatus.Ready, JobStatus.Missing, {
      message: 'Job timed out before started externally.',
    })
  }
}

export default new JobStatusReciever()
