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
        message: option.message || '',
        executeDirectoryPath: option.executeDirectoryPath || '',
        resultDirectoryPath: option.resultDirectoryPath || '',
        at: Date.now()
      };
      await doc.save();
    });
  }

  waiting(job) {
    this.emit(job, STATUS.Waiting);
  }

  running(job, executeDirectoryPath) {
    this.emit(job, STATUS.Running, { executeDirectoryPath });
  }

  completed(job, message, resultDirectoryPath) {
    this.emit(job, STATUS.Completed, { message, resultDirectoryPath });
  }

  errored(job, message, resultDirectoryPath) {
    this.emit(job, STATUS.Errored, { message, resultDirectoryPath });
  }

  missing(job) {
    this.emit(job, STATUS.Missing);
  }
}

export default new JobStatusReciever();
