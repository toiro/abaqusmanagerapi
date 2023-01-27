import { JobStatus } from 'model/resources/enums.js';
import { jobsOnAsRaw } from 'utils/job-find-queries.js';
import JobPickCriteria from './utils/JobPickerCriteria.js';

export default class JobPicker {
  // async _init() {
  //   const criteria = new JobPickCriteria();
  //   _getStartingJobs = (waitingJobs: Document<unknown>, runningJobs: Document<unknown>) => criteria.judge(waitingJobs, runningJobs)
  //   await criteria.init();
  //   return this;
  // }

  async pick() {
    // Waiting のジョブを取得し、priority - createdAt 順に並べる
    const waitingJobs = await jobsOnAsRaw(JobStatus.Waiting);
    if (waitingJobs.length === 0) return [];
    waitingJobs.sort((a, b) =>
      a.priority !== b.priority ? b.priority - a.priority : a.createdAt.getTime() - b.createdAt.getTime()
    );

    const runningJobs = await jobsOnAsRaw(JobStatus.Running);
    const startingJobs = await jobsOnAsRaw(JobStatus.Starting);
    const readyJobs = await jobsOnAsRaw(JobStatus.Ready);

    const countingJobs = runningJobs.concat(startingJobs).concat(readyJobs);

    // 起動条件を満たすジョブを選択する
    const criteria = new JobPickCriteria();
    await criteria.init();
    return criteria.judge(waitingJobs, countingJobs);
  }
}
