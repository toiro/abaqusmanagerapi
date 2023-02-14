import { EventEmitter } from 'events';
import JobModel from '../../app/store/model/job.js';
import { JobStatus } from '../../model/resources/enums.js';
import { asyncCallback } from '../../utils/asyncawait.js';
const Event = {
    Update: 'update',
    Transit: 'transit',
};
class JobStatusReciever extends EventEmitter {
    constructor() {
        super();
        this.on(Event.Update, asyncCallback(async (job, status, option = {}) => {
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
        this.on(Event.Transit, asyncCallback(async (job, fromStatus, toStatus, option = {}) => {
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
        this.emit(Event.Update, job, JobStatus.Waiting);
    }
    starting(job) {
        this.emit(Event.Update, job, JobStatus.Starting);
    }
    ready(job) {
        this.emit(Event.Update, job, JobStatus.Ready);
    }
    running(job, executeDirectoryPath) {
        this.emit(Event.Update, job, JobStatus.Running, { executeDirectoryPath });
    }
    completed(job, message, resultDirectoryPath) {
        this.emit(Event.Update, job, JobStatus.Completed, { message, resultDirectoryPath });
    }
    failed(job, message, resultDirectoryPath) {
        this.emit(Event.Update, job, JobStatus.Failed, { message, resultDirectoryPath });
    }
    missing(job, message) {
        this.emit(Event.Update, job, JobStatus.Missing, { message });
    }
    readyToMissing(job) {
        this.emit(Event.Transit, job, JobStatus.Ready, JobStatus.Missing, {
            message: 'Job timed out before started externally.',
        });
    }
}
export default new JobStatusReciever();
