import { EventEmitter } from 'events';
import STATUS from '~/models/enums/job-status.js';
import JobModel from '~/models/job.js';

class JobStatusReciever extends EventEmitter {
  constructor() {
    super();
    this.on('update', async(job, status, option) => {
      option = option || {};

      const doc = await JobModel.findById(job._id);
      doc.status = {
        code: status,
        message: option.message || doc.status.message || '',
        executeDirectoryPath: option.executeDirectoryPath || doc.status.executeDirectoryPath || '',
        resultDirectoryPath: option.resultDirectoryPath || doc.status.resultDirectoryPath || '',
        at: Date.now()
      };
      await doc.save();
    });
    // 前提ステータスの時だけ、ステータスを変更する
    this.on('transit', async(job, fromStatus, toStatus, option) => {
      option = option || {};
      const filter = {
        _id: job._id,
        'status.code': fromStatus
      };
      const update = {
        'status.code': toStatus,
        'status.at': Date.now()
      };
      if (option.message) {
        update['status.message'] = option.message;
      }
      await JobModel.findOneAndUpdate(filter, update);
    });
  }

  waiting(job) {
    this.emit('update', job, STATUS.Waiting);
  }

  starting(job) {
    this.emit('update', job, STATUS.Starting);
  }

  running(job, executeDirectoryPath) {
    this.emit('update', job, STATUS.Running, { executeDirectoryPath });
  }

  completed(job, message, resultDirectoryPath) {
    this.emit('update', job, STATUS.Completed, { message, resultDirectoryPath });
  }

  failed(job, message, resultDirectoryPath) {
    this.emit('update', job, STATUS.Failed, { message, resultDirectoryPath });
  }

  missing(job) {
    this.emit('update', job, STATUS.Missing);
  }

  startingToMissing(job) {
    this.emit('transit', job, STATUS.Starting, STATUS.Missing, { message: 'Timeout for starting externally.' });
  }
}

export default new JobStatusReciever();
