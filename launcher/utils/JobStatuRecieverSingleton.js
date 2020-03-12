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
  }

  waiting(job) {
    this.emit('update', job, STATUS.Waiting);
  }

  running(job, executeDirectoryPath) {
    this.emit('update', job, STATUS.Running, { executeDirectoryPath });
  }

  completed(job, message, resultDirectoryPath) {
    this.emit('update', job, STATUS.Completed, { message, resultDirectoryPath });
  }

  errored(job, message, resultDirectoryPath) {
    this.emit('update', job, STATUS.Errored, { message, resultDirectoryPath });
  }

  missing(job) {
    this.emit('update', job, STATUS.Missing);
  }
}

export default new JobStatusReciever();
