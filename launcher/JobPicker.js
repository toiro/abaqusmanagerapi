import * as queries from '~/utils/job-find-queries.js';
import STATUS from '~/models/enums/job-status.js';
import CONFIGKEY from '~/models/enums/config-key.js';
import storedConfig from '~/utils/storedConfig.js';
import * as licence from '~/utils/abaqus-licence.js';
import UserModel from '~/models/user.js';
import NodeModel from '~/models/node.js';

export default class JobPicker {
  async _init() {
    const criteria = new JobPickCriteria();
    await criteria.init();
    this._getStartingJobs = (waitingJobs, runningJobs) => criteria.judge(waitingJobs, runningJobs);
    return this;
  }

  async pick() {
    await this._init();

    // Waiting のジョブを取得し、priority - createdAt 順に並べる
    const waitingJobs = await queries.jobsOn(STATUS.Waiting, true);
    if (waitingJobs.length === 0) return [];
    waitingJobs.sort((a, b) => a.priority !== b.priority ? b.priority - a.priority : a.createdAt - b.createdAt);

    const runningJobs = await queries.jobsOn(STATUS.Running, true);
    const startingJobs = await queries.jobsOn(STATUS.Starting, true);

    // 起動条件を満たすジョブを選択する
    return this._getStartingJobs(waitingJobs, runningJobs.concat(startingJobs));
  }
}

class JobPickCriteria {
  async init() {
    this.users = (await UserModel.find().exec()).reduce((map, user) => {
      map[user.name] = user;
      return map;
    }, {});
    this.nodes = (await NodeModel.find().exec()).reduce((map, node) => {
      map[node.hostname] = node;
      return map;
    }, {});
    this.availableToken = await storedConfig.get(CONFIGKEY.AvailableTokenCount);
  }

  judge(waitingJobs, runningJobs) {
    const startingJobs = [];

    for (const job of waitingJobs) {
      if (this.judgeJob(job, runningJobs.concat(startingJobs))) {
        startingJobs.push(job);
      }
    }

    return startingJobs;
  }

  judgeJob(job, runningJobs) {
    function countJob(jobs) {
      return jobs.reduce(
        (sum, job) => sum + (job.input.external.maxConcurrentJobs ? job.input.external.maxConcurrentJobs : 1),
        0
      );
    }

    // ユーザー同時実行数
    const maxConcurrentJobForUser = this.users[job.owner] ? this.users[job.owner].maxConcurrentJob : 0;
    const ownerCount = countJob(runningJobs.filter(_ => _.owner === job.owner).concat([job]));
    if (ownerCount > maxConcurrentJobForUser) return false;

    // サーバー同時実行数
    const maxConcurrentJobForNode = this.nodes[job.node].maxConcurrentJob;
    const nodeCount = countJob(runningJobs.filter(_ => _.node == job.node).concat([job]));
    if (nodeCount > maxConcurrentJobForNode) return false;

    // ライセンス
    const tokenToClaim = licence.calcLicenceForJob(job);
    const tokenInUse = licence.calcLicenceForJobs(runningJobs);
    if (tokenToClaim > this.availableToken - tokenInUse) return false;

    return true;
  }
}
