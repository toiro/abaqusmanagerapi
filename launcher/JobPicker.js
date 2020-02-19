import { EventEmitter } from 'events';
import * as queries from './utils/queries.js';
import STATUS from '~/models/enums/job-status.js';
import CONFIGKEY from '~/models/enums/config-key.js';
import storedConfig from '~/utils/storedConfig.js';
import UserModel from '~/models/user.js';

export default class JobPicker extends EventEmitter {
  constructor() {
    super();
    this.jobMaxForNodes = {};
    this.availableToken = 0;
  }

  async init() {
    this.jobMaxForNodes = await storedConfig.get(CONFIGKEY.JobMaxForNodes);
    this.availableToken = await storedConfig.get(CONFIGKEY.AvailableTokenCount);
    this.emit('initialized');
    // const remainToken // TODO 実際に残っているトークン
    return this;
  }

  async pick() {
    // Waiting のジョブを取得する
    const waitingJobs = await queries.jobsOn(STATUS.Waiting);
    if (waitingJobs.length === 0) return null;

    // priority - createdAt 順に並べる
    waitingJobs.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt);

    // 起動条件を満たすジョブを選択する
    const runningJobs = await queries.jobsOn(STATUS.Running);
    const allowPassing = false; // TODO add to config
    if (allowPassing) {
      return this._isReadyToLaunch(waitingJobs[0], runningJobs) ? waitingJobs[0] : null;
    } else {
      for (const job in waitingJobs) {
        if (await this._isReadyToLaunch(job, runningJobs)) {
          this.emit('pick', job);
          return job;
        }
      }
    }
  }

  async _isReadyToLaunch(job, runningJobs) {
    const node = job.node;
    const owner = job.owner;
    const maxConcurrentJobForUser = getMaxConcurrentJobForUser(owner);

    const nodeCount = runningJobs.filter(_ => _.node == node).length;
    const ownerCount = runningJobs.filter(_ => _.owner === owner).length;
    const tokenToClaim = sumTokenToClaime([job]);
    const tokenInUse = sumTokenToClaime(runningJobs);

    if (nodeCount > this.jobMaxForNodes[job.node]) return false;
    if (ownerCount > maxConcurrentJobForUser) return false;
    if (tokenToClaim > this.availableToken - tokenInUse) return false;

    return true;
  };
}

async function getMaxConcurrentJobForUser(name) {
  const doc = await UserModel.find({ name }).exec();
  return doc.maxConcurrentJob;
}

function sumTokenToClaime(jobs) {
  return 100; // TODO
}
