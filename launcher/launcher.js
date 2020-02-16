import { EventEmitter } from 'events';
import * as queries from './utils/queries.js';
import UserModel from '~/models/user.js';
import STATUS from '~/models/enums/job-status.js';
import CONFIGKEY from '~/models/enums/config-key.js';
import storedConfig from '~/utils/storedConfig.js';

export default class Launcher extends EventEmitter {
  // constructor () {super();};
  invoke() {
    try {
      launchJobs(this);
    } catch (error) {
      this.emit('error', error);
    }
  }
}

async function launchJobs(emitter) {
  // Waiting のジョブを取得する
  const waitingJobs = await queries.jobsOn(STATUS.Waiting);
  // priority - createdAt 順に並べる
  waitingJobs.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt);

  const jobMaxForNodes = await storedConfig.get(CONFIGKEY.JobMaxForNodes);
  const availableToken = await storedConfig.get(CONFIGKEY.AvailableTokenCount);

  // Job 起動
  const runningJobs = await queries.jobsOn(STATUS.Running);
  for (const job in waitingJobs) {
    if (await isReadyToLaunch(job, runningJobs, jobMaxForNodes, availableToken)) {
      emitter.emit('launch', job.toObject());
      await launchJob(job, emitter);
    }
  }
  // 後始末？
}

async function isReadyToLaunch(job, runningJobs, jobMaxForNodes, availableToken) {
  const node = job.node;
  const owner = job.owner;
  const maxConcurrentJobForUser = getMaxConcurrentJobForUser(owner);

  const nodeCount = runningJobs.filter(_ => _.node == node).length;
  const ownerCount = runningJobs.filter(_ => _.owner === owner).length;
  const tokenToClaim = sumTokenToClaime([job]);
  const tokenInUse = sumTokenToClaime(runningJobs);

  if (nodeCount > jobMaxForNodes[job.node]) return false;
  if (ownerCount > maxConcurrentJobForUser) return false;
  if (tokenToClaim > availableToken - tokenInUse) return false;

  return true;
};

function sumTokenToClaime(jobs) {
  return 100; // TODO
}

function launchJob(job, emitter) {
  // シェル起動は await しない
  setTimeout(() => {
    // TODO
    emitter.emit('finish', job.toObject());
  }, 2000);
};

async function getMaxConcurrentJobForUser(name) {
  const doc = await UserModel.find({ name }).exec();
  return doc.maxConcurrentJob;
}
