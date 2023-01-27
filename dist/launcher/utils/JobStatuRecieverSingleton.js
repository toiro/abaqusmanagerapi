import { EventEmitter } from 'events';
import JobModel from '../../model/job.js';
import { JobStatus } from '../../model/resources/enums.js';
function asyncListener(fn) {
    return (...args) => {
        // eslint-disable-next-line no-void
        void fn(...args);
    };
}
class JobStatusReciever extends EventEmitter {
    constructor() {
        super();
        this.on('update', asyncListener(async (job, status, option) => {
            option = option ?? {};
            const doc = (await JobModel.findById(job._id));
            doc.status = {
                code: status,
                message: option.message ?? doc.status.message ?? '',
                executeDirectoryPath: option.executeDirectoryPath ?? doc.status.executeDirectoryPath ?? '',
                resultDirectoryPath: option.resultDirectoryPath ?? doc.status.resultDirectoryPath ?? '',
                at: new Date(),
            };
            await doc.save();
        }));
        // 前提ステータスの時だけ、ステータスを変更する
        this.on('transit', asyncListener(async (job, fromStatus, toStatus, option) => {
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
        }));
    }
    waiting(job) {
        this.emit('update', job, JobStatus.Waiting);
    }
    starting(job) {
        this.emit('update', job, JobStatus.Starting);
    }
    ready(job) {
        this.emit('update', job, JobStatus.Ready);
    }
    running(job, executeDirectoryPath) {
        this.emit('update', job, JobStatus.Running, { executeDirectoryPath });
    }
    completed(job, message, resultDirectoryPath) {
        this.emit('update', job, JobStatus.Completed, { message, resultDirectoryPath });
    }
    failed(job, message, resultDirectoryPath) {
        this.emit('update', job, JobStatus.Failed, { message, resultDirectoryPath });
    }
    missing(job) {
        this.emit('update', job, JobStatus.Missing);
    }
    readyToMissing(job) {
        this.emit('transit', job, JobStatus.Ready, JobStatus.Missing, {
            message: 'Job timed out before started externally.',
        });
    }
}
export default new JobStatusReciever();
