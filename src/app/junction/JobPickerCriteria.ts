import storedConfig from 'app/junction/storedConfig.js';
import * as licence from 'app/junction/abaqus/abaqus-licence.js';
import { ConfigKey } from 'model/resources/enums.js';
import type { IUser } from 'model/user.js';
import type { INode } from 'model/node.js';
import type { IJob } from 'model/job.js';
import { getActiveNodes, getActiveUsers } from './queries.js';

export default class JobPickCriteria {
  users: { [name: string]: IUser } = {};

  nodes: { [hostname: string]: INode } = {};

  availableToken: number = 0;

  async init() {
    this.users = await getActiveUsers();
    this.nodes = await getActiveNodes();
    this.availableToken = Number.parseInt(await storedConfig.get(ConfigKey.AvailableTokenCount), 10);
  }

  judge(waitingJobs: IJob[], runningJobs: IJob[]) {
    const startingJobs: IJob[] = [];

    // process one by one
    // eslint-disable-next-line no-restricted-syntax
    for (const job of waitingJobs) {
      if (this.judgeJob(job, runningJobs.concat(startingJobs))) {
        startingJobs.push(job);
      }
    }

    return startingJobs;
  }

  judgeJob(job: IJob, runningJobs: IJob[]) {
    function countJob(jobs: IJob[]) {
      return jobs.reduce(
        (sum, j) => sum + (j.input.external?.maxConcurrentJobs ? j.input.external.maxConcurrentJobs : 1),
        0
      );
    }

    // ユーザー同時実行数
    const user = this.users[job.owner];
    const maxConcurrentJobForUser = user ? user.maxConcurrentJob : 0;
    const ownerCount = countJob(runningJobs.filter((_) => _.owner === job.owner).concat([job]));
    if (ownerCount > maxConcurrentJobForUser) return false;

    // サーバー同時実行数
    const node = this.nodes[job.node];
    const maxConcurrentJobForNode = node ? node.maxConcurrentJob : 0;
    const nodeCount = countJob(runningJobs.filter((_) => _.node === job.node).concat([job]));
    if (nodeCount > maxConcurrentJobForNode) return false;

    // ライセンス
    const tokenToClaim = licence.calcLicenceForJob(job);
    const tokenInUse = licence.calcLicenceForJobs(runningJobs);
    if (this.availableToken < tokenToClaim + tokenInUse) return false;

    return true;
  }
}
