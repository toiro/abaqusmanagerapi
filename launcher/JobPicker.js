import * as queries from './utils/queries.js';
import STATUS from '~/models/enums/job-status.js';
import CONFIGKEY from '~/models/enums/config-key.js';
import storedConfig from '~/utils/storedConfig.js';
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
    const waitingJobs = await queries.jobsOn(STATUS.Waiting);
    if (waitingJobs.length === 0) return null;
    waitingJobs.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt);

    const runningJobs = await queries.jobsOn(STATUS.Running);

    // 起動条件を満たすジョブを選択する
    return this._getStartingJobs(waitingJobs, runningJobs);
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
    // ユーザー同時実行数
    const maxConcurrentJobForUser = this.users[job.owner] ? this.users[job.owner].maxConcurrentJob : 0;
    const ownerCount = runningJobs.filter(_ => _.owner === job.owner).length;
    if (ownerCount + 1 > maxConcurrentJobForUser) return false;

    // サーバー同時実行数
    const maxConcurrentJobForNode = this.nodes[job.node].maxConcurrentJob;
    const nodeCount = runningJobs.filter(_ => _.node == job.node).length;
    if (nodeCount + 1 > maxConcurrentJobForNode) return false;

    // ライセンス
    /*
    const tokenToClaim = this.sumTokenToClaime([job]);
    const tokenInUse = this.sumTokenToClaime(runningJobs);
    if (tokenToClaim > this.availableToken - tokenInUse) return false;
    // */

    return true;
  }

  sumTokenToClaime(jobs) {
    return 100; // TODO
  }
}
