import type { JobStatus } from 'model/resources/enums.js';
import JobModel from 'model/job.js';

// /**
//  * @param { JobStatus } status 取得するジョブのステータス
//  * @param { boolean } raw ジョブを mongoose のドキュメントとして取得するか
//  */
// async function _jobsOn(status: JobStatus, raw = false) {
//   const rawObjects = await JobModel.find({ 'status.code': status }).exec();
//   return raw ? rawObjects : rawObjects.map(r => r.toObject());
// }

export async function jobsOnAsRaw(status: JobStatus) {
  const rawObjects = await JobModel.find({ 'status.code': status }).exec();
  return rawObjects;
}

export async function jobsOnAsObj(status: JobStatus) {
  return (await jobsOnAsRaw(status)).map((r) => r.toObject());
}
