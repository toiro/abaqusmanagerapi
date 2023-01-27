import { EventEmitter } from 'events';
import JobModel from 'model/job.js';
import { JobStatus } from 'model/resources/enums.js';
import type { Job } from 'model/resources/types.js';

function asyncListener<ARGS extends unknown[]>(fn: (...args: ARGS) => Promise<unknown>): (...args: ARGS) => void {
  return (...args) => {
    // eslint-disable-next-line no-void
    void fn(...args);
  };
}

class JobStatusReciever extends EventEmitter {
  constructor() {
    super();
    this.on(
      'update',
      asyncListener(async (job: Job, status: JobStatus, option?: { [key: string]: string }) => {
        option = option ?? {};

        const doc: Job = (await JobModel.findById(job._id))!;
        doc.status = {
          code: status,
          message: option.message ?? doc.status.message ?? '',
          executeDirectoryPath: option.executeDirectoryPath ?? doc.status.executeDirectoryPath ?? '',
          resultDirectoryPath: option.resultDirectoryPath ?? doc.status.resultDirectoryPath ?? '',
          at: new Date(),
        };
        await doc.save();
      })
    );
    // 前提ステータスの時だけ、ステータスを変更する
    this.on(
      'transit',
      asyncListener(
        async (job: Job, fromStatus: JobStatus, toStatus: JobStatus, option?: { [key: string]: string }) => {
          option = option ?? {};
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
      )
    );
  }

  waiting(job: Job) {
    this.emit('update', job, JobStatus.Waiting);
  }

  starting(job: Job) {
    this.emit('update', job, JobStatus.Starting);
  }

  ready(job: Job) {
    this.emit('update', job, JobStatus.Ready);
  }

  running(job: Job, executeDirectoryPath: string) {
    this.emit('update', job, JobStatus.Running, { executeDirectoryPath });
  }

  completed(job: Job, message: string, resultDirectoryPath: string) {
    this.emit('update', job, JobStatus.Completed, { message, resultDirectoryPath });
  }

  failed(job: Job, message: string, resultDirectoryPath?: string) {
    this.emit('update', job, JobStatus.Failed, { message, resultDirectoryPath });
  }

  missing(job: Job) {
    this.emit('update', job, JobStatus.Missing);
  }

  readyToMissing(job: Job) {
    this.emit('transit', job, JobStatus.Ready, JobStatus.Missing, {
      message: 'Job timed out before started externally.',
    });
  }
}

export default new JobStatusReciever();
