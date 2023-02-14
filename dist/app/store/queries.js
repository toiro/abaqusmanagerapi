import '../../app/store/model/job.js';
import '../../app/store/model/user.js';
import '../../app/store/model/node.js';
// /**
//  * @param { JobStatus } status 取得するジョブのステータス
//  * @param { boolean } raw ジョブを mongoose のドキュメントとして取得するか
//  */
// async function _jobsOn(status: JobStatus, raw = false) {
//   const rawObjects = await JobModel.find({ 'status.code': status }).exec();
//   return raw ? rawObjects : rawObjects.map(r => r.toObject());
// }
