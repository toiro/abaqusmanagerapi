import JobStatus from '~/models/enums/job-status.js';
import JobModel from '~/models/job.js';

/**
 * @param { [string] } status 取得するジョブのステータス
 */
export async function jobsOn(status) {
  if (!Object.values(JobStatus).includes(status)) {
    throw new Error(`Invailid status code: ${status}`);
  }
  return JobModel.find({ 'status.code': status }).exec();
}
