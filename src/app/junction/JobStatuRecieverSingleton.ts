import { EventEmitter } from 'events';
import JobModel from 'app/store/model/job.js';
import { JobStatus } from 'model/resources/enums.js';
import type { IJob } from 'model/job.js';
import { logger } from 'utils/logger.js';

const Event = {
  Update: 'update',
  Transit: 'transit',
} as const;
type Event = (typeof Event)[keyof typeof Event];

export type JobStatusRecieverEventOption = {
  message?: string;
  executeDirectoryPath?: string;
  resultDirectoryPath?: string;
};

class JobStatusReciever extends EventEmitter {
  constructor() {
    super();
    this.on(Event.Update, async (job: IJob, status: JobStatus, option: JobStatusRecieverEventOption = {}) => {
      const doc = (await JobModel.findById(job._id))!;
      doc.status = {
        code: status,
        message: option.message ?? doc.status.message ?? '',
        executeDirectoryPath: option.executeDirectoryPath ?? doc.status.executeDirectoryPath ?? '',
        resultDirectoryPath: option.resultDirectoryPath ?? doc.status.resultDirectoryPath ?? '',
        at: new Date(),
      };
      logger.verbose(`${job._id.toString()}: ${job.status.code} => ${status}`);
      await doc.save();
    });
    // 前提ステータスの時だけ、ステータスを変更する
    this.on(
      Event.Transit,
      async (job: IJob, fromStatus: JobStatus, toStatus: JobStatus, option: { [key: string]: string } = {}) => {
        const filter = {
          _id: job._id,
          'status.code': fromStatus,
        };
        const update = {
          'status.code': toStatus,
          'status.at': new Date(),
          'status.message': option.message ? option.message : undefined,
        };
        await JobModel.findOneAndUpdate(filter, update);
      }
    );
  }

  waiting(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Waiting);
  }

  starting(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Starting);
  }

  ready(job: IJob) {
    this.emit(Event.Update, job, JobStatus.Ready);
  }

  running(job: IJob, executeDirectoryPath: string) {
    this.emit(Event.Update, job, JobStatus.Running, { executeDirectoryPath });
  }

  completed(job: IJob, message: string, resultDirectoryPath: string) {
    this.emit(Event.Update, job, JobStatus.Completed, { message, resultDirectoryPath });
  }

  failed(job: IJob, message: string, resultDirectoryPath?: string) {
    this.emit(Event.Update, job, JobStatus.Failed, { message, resultDirectoryPath });
  }

  missing(job: IJob, message: string) {
    this.emit(Event.Update, job, JobStatus.Missing, { message });
  }

  readyToMissing(job: IJob) {
    this.emit(Event.Transit, job, JobStatus.Ready, JobStatus.Missing, {
      message: 'Job timed out before started externally.',
    });
  }
}

export default new JobStatusReciever();
