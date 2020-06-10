import JobStatus from '~/models/enums/job-status.js';
import JobModel from '~/models/job.js';

/**
 * @param { string } status 取得するジョブのステータス
 * @param { boolean } raw ジョブを mongoose のドキュメントとして取得するか
 */
export async function jobsOn(status, raw = false) {
  if (!Object.values(JobStatus).includes(status)) {
    throw new Error(`Invailid status code: ${status}`);
  }
  const rawObjects = await JobModel.find({ 'status.code': status }).exec();
  return raw ? rawObjects : rawObjects.map(r => r.toObject());
}
